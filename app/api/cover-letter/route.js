import { NextResponse } from 'next/server';
import { generateWithFallback } from '@/lib/gemini';
import { robustParseJSON } from '@/lib/json-utils';

export async function POST(req) {
  try {
    const { resume, jd, type = 'cover-letter' } = await req.json();

    if (!resume || !jd) {
      return NextResponse.json({ error: 'Resume and job description are required.' }, { status: 400 });
    }

    if (resume.includes('[File Uploaded:')) {
      return NextResponse.json({ error: 'This analysis only contains a placeholder. Please re-run the Resume Analyser for this job to generate a fresh analysis first.' }, { status: 400 });
    }

    const prompt = type === 'cover-letter' 
      ? `You are an expert career coach. Write a professional, high-impact cover letter based on this resume and job description. 
         Focus on matching the user's specific achievements to the job requirements. Keep it under 300 words.
         
         RESUME:
         ${resume}
         
         JD:
         ${jd}
         
         Return ONLY a valid JSON object (no markdown, no backticks) with "title" and "content" fields.`
      : type === 'cold-email'
      ? `You are an expert career coach. Write a professional, punchy cold email for a referral or a direct reach-out to a hiring manager for this role.
         Use the user's resume for context. Keep it very short and conversational yet professional.
         
         RESUME:
         ${resume}
         
         JD:
         ${jd}
         
         Return ONLY a valid JSON object (no markdown, no backticks) with "title" (subject line) and "content" (email body) fields.`
      : `You are an expert career coach. Write a highly personalized LinkedIn connection request (max 300 characters) for a recruiter or engineer at ${type === 'linkedin-networking' ? 'this company' : 'a company'}.
         Use the user's resume for context. Mention one specific skill or achievement that makes them a great fit for the role.
         
         RESUME:
         ${resume}
         
         JD:
         ${jd}
         
         Return ONLY a valid JSON object (no markdown, no backticks) with "title" (e.g. "LinkedIn Connection Request") and "content" (the 300-char message) fields.`;

    const text = await generateWithFallback(prompt);
    
    try {
      const parsed = robustParseJSON(text);
      return NextResponse.json(parsed);
    } catch (parseError) {
      console.error('Cover Letter JSON parse error:', parseError);
      return NextResponse.json({ 
        error: 'Failed to generate content. Please try again.'
      }, { status: 500 });
    }
  } catch (err) {
    console.error('Cover Letter API error:', err);
    return NextResponse.json({ error: `API Error: ${err.message}` }, { status: 500 });
  }
}
