import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { resume, jd, type = 'cover-letter' } = await req.json();

    if (!resume || !jd) {
      return NextResponse.json({ error: 'Resume and job description are required.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured.' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    let model;
    let fallbackUsed = false;
    try {
      model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    } catch (e) {
      model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
      fallbackUsed = true;
    }

    const prompt = type === 'cover-letter' 
      ? `You are an expert career coach. Write a professional, high-impact cover letter based on this resume and job description. 
         Focus on matching the user's specific achievements to the job requirements. Keep it under 300 words.
         
         RESUME:
         ${resume}
         
         JD:
         ${jd}
         
         Return a JSON object with "title" and "content" fields.`
      : type === 'cold-email'
      ? `You are an expert career coach. Write a professional, punchy cold email for a referral or a direct reach-out to a hiring manager for this role.
         Use the user's resume for context. Keep it very short and conversational yet professional.
         
         RESUME:
         ${resume}
         
         JD:
         ${jd}
         
         Return a JSON object with "title" (subject line) and "content" (email body) fields.`
      : `You are an expert career coach. Write a highly personalized LinkedIn connection request (max 300 characters) for a recruiter or engineer at ${type === 'linkedin-networking' ? 'this company' : 'a company'}.
         Use the user's resume for context. Mention one specific skill or achievement that makes them a great fit for the role.
         
         RESUME:
         ${resume}
         
         JD:
         ${jd}
         
         Return a JSON object with "title" (e.g. "LinkedIn Connection Request") and "content" (the 300-char message) fields.`;

    let result;
    try {
      result = await model.generateContent(prompt);
    } catch (err) {
      if (!fallbackUsed) {
        model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
        result = await model.generateContent(prompt);
      } else {
        throw err;
      }
    }
    const response = await result.response;
    const text = response.text();
    
    // Clean JSON parsing
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to generate content.' }, { status: 500 });
    }

    if (resume.includes('[File Uploaded:')) {
      return NextResponse.json({ error: 'This analysis only contains a placeholder. Please re-run the Resume Analyser for this job to generate a fresh analysis first.' }, { status: 400 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error('Cover Letter API error:', err);
    return NextResponse.json({ error: `API Error: ${err.message}` }, { status: 500 });
  }
}
