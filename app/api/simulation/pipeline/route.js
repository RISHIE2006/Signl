import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { 
      company,
      role,
      roundDef,
      messages,
      currentCode,
      currentCodeLanguage
    } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured.' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    let roundContext = '';
    
    if (roundDef.id === 'recruiter') {
      roundContext = `You are the Recruiter ("The Culture Fit") for ${company} interviewing a candidate for ${role}.
      Focus on basic background, culture fit, red flags, and salary expectations. Keep replies short.`;
    } else if (roundDef.id === 'coding') {
      roundContext = `You are a Senior Engineer ("The Technical Guru") at ${company} doing a technical screen for ${role}.
      Ask algorithmic or specific coding questions. You must critically evaluate the code.
      Current code state:
      \`\`\`${currentCodeLanguage || 'javascript'}
      ${currentCode || ''}
      \`\`\``;
    } else if (roundDef.id === 'sysdesign') {
      roundContext = `You are the Principal Architect at ${company} interviewing for ${role}.
      Ask deep system design questions: scalability, trade-offs, database choices, load balancing.`;
    } else if (roundDef.id === 'panel') {
      roundContext = `You are acting as a TWO-PERSON BEHAVIORAL PANEL from ${company} interviewing for ${role}.
      You play "Sarah" (an empathetic product manager) AND "David" (a skeptical, detail-oriented engineering manager).
      When speaking, CLEARLY prefix your text with either "Sarah:" or "David:". 
      They should take turns asking questions or following up on the candidate's answers.`;
    } else if (roundDef.id === 'executive') {
      roundContext = `You are the Founder/VP ("The Executive") at ${company}.
      Ask high-stakes, visionary, and impact-oriented questions. Challenge the candidate's core motivations. Be intimidating but fair.`;
    }

    const systemPrompt = `
      ${roundContext}
      Always stay in character.
      Keep your responses professional, realistic, and to the point (no more than 3 sentences).
      Do NOT break character. Do not provide disclaimers.
    `;

    const formattedHistory = messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    const chat = model.startChat({
      history: formattedHistory.length > 1 ? formattedHistory.slice(0, -1) : [],
    });

    const lastMessage = formattedHistory[formattedHistory.length - 1].parts[0].text;
    const result = await chat.sendMessage(systemPrompt + '\n\nCandidate says:\n' + lastMessage);

    return NextResponse.json({ content: result.response.text() });
  } catch (error) {
    console.error('Pipeline Simulation API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate response' }, { status: 500 });
  }
}
