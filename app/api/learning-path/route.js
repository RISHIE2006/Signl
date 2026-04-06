import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { skills, role } = await req.json();

    if (!skills || !Array.isArray(skills) || skills.length === 0) {
      return NextResponse.json({ error: 'Skills are required.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured.' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

    const prompt = `You are an expert technical mentor. For the following skill gaps identified for a ${role} position, provide a structured learning path with specific, high-quality resources.
         
         SKILL GAPS: ${skills.join(', ')}
         
         For each skill, return:
         1. A brief explanation of why it's important for this role.
         2. 2-3 specific resources (e.g., "YouTube: [Channel Name] - [Video Title]", "Official Docs: [URL]", or "Course: [Platform] - [Course Name]").
         
         Return the response as a JSON array of objects, one for each skill:
         [
           {
             "skill": "Skill Name",
             "importance": "...",
             "resources": ["...", "..."]
           }
         ]

         Return ONLY valid JSON (no markdown, no backticks).`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to generate learning path.' }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error('Learning Path API error:', err);
    return NextResponse.json({ error: 'Failed to process learning path.' }, { status: 500 });
  }
}
