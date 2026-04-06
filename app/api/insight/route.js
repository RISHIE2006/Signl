import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { applications } = await req.json();
    if (!applications || applications.length === 0) return NextResponse.json({ insight: '' });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key') return NextResponse.json({ insight: '' });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const summary = applications.map(a => `${a.company} - ${a.role} (${a.stage})`).join(', ');
    const prompt = `You are a calm, supportive career coach. A job seeker has logged the following applications: ${summary}.

In 2 sentences, give them ONE specific, actionable coaching insight based on visible patterns. Be non-judgmental. Focus on what they can do next. Do not use generic advice. Return only the insight text, no preamble.`;

    const result = await model.generateContent(prompt);
    return NextResponse.json({ insight: result.response.text().trim() });
  } catch {
    return NextResponse.json({ insight: '' });
  }
}
