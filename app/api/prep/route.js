import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { company, role, jd } = await req.json();

    if (!company || !role) {
      return NextResponse.json({ error: 'Company and role are required.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key') {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured.' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    let model;
    try {
      model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    } catch {
      model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
    }

    const prompt = `You are an elite interview coach specialising in ${role} roles at ${company}.
${jd ? `\nJob Description provided:\n${jd}\n` : ''}
Generate a comprehensive interview prep pack. Return ONLY valid JSON (no markdown, no backticks) in exactly this format:
{
  "questions": [
    { "question": "<interview question text>", "type": "<Behavioural|Technical|Culture|Situational>", "hint": "<brief 1-sentence coaching hint on how to approach this question>" }
  ],
  "starPrompts": [
    { "prompt": "<a specific STAR scenario prompt to prepare>", "whyItMatters": "<1 sentence explaining why this scenario is relevant>" }
  ],
  "tips": [
    "<specific, actionable tip relevant to this company and role>"
  ],
  "redFlags": [
    "<common mistake or red flag to avoid for this role>"
  ]
}

Rules:
- questions: exactly 7 questions. Mix: 3 behavioural, 2 technical/role-specific, 1 culture, 1 situational
- starPrompts: exactly 3 prompts, deeply specific to the role
- tips: exactly 4 tips, company-specific where possible
- redFlags: exactly 3 red flags
- Be concrete, specific, and non-generic. Do not give textbook answers.`;

    let result;
    try {
      result = await model.generateContent(prompt);
    } catch (err) {
      model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
      result = await model.generateContent(prompt);
    }

    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Could not parse AI response. Try again.' }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error('Prep API error:', err);
    return NextResponse.json({ error: err.message || 'Prep generation failed.' }, { status: 500 });
  }
}
