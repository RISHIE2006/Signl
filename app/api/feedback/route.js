import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { question, answer, company, role } = await req.json();

    if (!question || !answer) {
      return NextResponse.json({ error: 'Question and answer are required.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured.' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

    const prompt = `You are an expert interviewer for ${company} interviewing a candidate for a ${role} position.
         
         QUESTION: "${question}"
         CANDIDATE'S ANSWER: "${answer}"
         
         Evaluate the candidate's answer and provide detailed feedback in JSON format.
         Include:
         1. A "score" (1-10) based on clarity, structure (STAR method), and relevance.
         2. "strengths" (list of what they did well).
         3. "improvements" (list of specific things to fix or add).
         4. "sampleAnswer" (a high-quality sample response for this question).

         Return ONLY valid JSON (no markdown, no backticks).`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean JSON parsing
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to evaluate answer.' }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error('Feedback API error:', err);
    return NextResponse.json({ error: 'Failed to process feedback.' }, { status: 500 });
  }
}
