import { NextResponse } from 'next/server';
import { generateWithFallback } from '@/lib/gemini';
import { robustParseJSON } from '@/lib/json-utils';

export async function POST(req) {
  try {
    const { company, role, jd } = await req.json();

    if (!company || !role) {
      return NextResponse.json({ error: 'Company and role are required.' }, { status: 400 });
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

    const text = await generateWithFallback(prompt);
    
    try {
      const parsed = robustParseJSON(text);
      return NextResponse.json(parsed);
    } catch (parseError) {
      console.error('Prep JSON parse error:', parseError);
      return NextResponse.json({ 
        error: 'Failed to generate interview prep. Please try again.'
      }, { status: 500 });
    }
  } catch (err) {
    console.error('Prep API error:', err);
    return NextResponse.json({ error: err.message || 'Prep generation failed.' }, { status: 500 });
  }
}
