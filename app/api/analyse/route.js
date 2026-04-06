import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import mammoth from 'mammoth';

export async function POST(req) {
  try {
    let resume = '';
    let jd = '';

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const resumeFile = formData.get('resumeFile');
      jd = formData.get('jd');

      if (resumeFile && typeof resumeFile !== 'string') {
        const buffer = Buffer.from(await resumeFile.arrayBuffer());
        
        if (resumeFile.type === 'application/pdf') {
          // Dynamic import to avoid build-time ESM resolution issues with Turbopack
          const pdfNamespace = await import('pdf-parse');
          // In some environments, it might be in .default or just the namespace
          const PDFParse = pdfNamespace.PDFParse || pdfNamespace.default?.PDFParse;
          
          if (!PDFParse) {
             // Fallback to the standard function if the class isn't found
             const pdfFunc = pdfNamespace.default || pdfNamespace;
             const data = await pdfFunc(buffer);
             resume = data.text;
          } else {
             const parser = new PDFParse({ data: buffer });
             const data = await parser.getText();
             resume = data.text;
          }
        } else if (
          resumeFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
          resumeFile.type === 'application/msword'
        ) {
          const result = await mammoth.extractRawText({ buffer });
          resume = result.value;
        } else {
          return NextResponse.json({ error: 'Unsupported file type.' }, { status: 400 });
        }
      }
    } else {
      const body = await req.json();
      resume = body.resume;
      jd = body.jd;
    }

    if (!resume || !jd) {
      return NextResponse.json({ error: 'Resume and job description are required.' }, { status: 400 });
    }

    // Truncate to prevent extreme lengths for combined request
    const cleanResume = resume.slice(0, 8000);
    const cleanJd = jd.slice(0, 4000);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key') {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured in .env.local.' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Try Gemini 2.0 Flash first, fallback to 1.5 Flash if quota/error occurs
    let model;
    let fallbackUsed = false;
    
    try {
      model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      // We do a small check or just proceed to the full prompt
    } catch (e) {
      model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
      fallbackUsed = true;
    }

    const prompt = `You are an expert career coach and resume writer. Compare this resume against the JD.

RESUME:
${cleanResume}

JD:
${cleanJd}

INSTRUCTIONS:
1. Analyse the match (0-100 score, missing keywords, skill gaps, and a short coach insight).
2. Rewrite the resume content to perfectly match the JD. Focus on high-impact STAR bullet points (results-oriented).

Return ONLY valid JSON (no markdown, no backticks) in exactly this format:
{
  "matchScore": 85,
  "missingKeywords": ["keyword1", "keyword2"],
  "skillGaps": ["skill1", "skill2"],
  "coachInsight": "A 2-3 sentence supportive insight.",
  "tailoredResume": {
    "summary": "A 3-4 sentence high-impact summary tailored to this role.",
    "experience": [
      { 
        "role": "Role Title", 
        "company": "Company Name", 
        "period": "Date Range", 
        "bullets": ["Achievement bullet 1", "Achievement bullet 2"] 
      }
    ],
    "skills": ["Top 10-12 relevant skills"],
    "education": [
      { "degree": "Degree", "school": "School", "year": "Year" }
    ]
  }
}`;

    let result;
    try {
      result = await model.generateContent(prompt);
    } catch (err) {
      // If 2.0 failed with Quota or other error, try 1.5
      if (!fallbackUsed) {
        console.log('Gemini 2.0 failed, falling back to 1.5 Flash...');
        model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
        result = await model.generateContent(prompt);
      } else {
        throw err;
      }
    }

    const text = result.response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('AI response did not contain JSON:', text);
      return NextResponse.json({ error: 'The AI provided an unexpected response format. Please try again.' }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ ...parsed, resumeText: resume });
  } catch (err) {
    console.error('Analyse API error:', err);
    return NextResponse.json({ error: err.message || 'Analysis failed.' }, { status: 500 });
  }
}
