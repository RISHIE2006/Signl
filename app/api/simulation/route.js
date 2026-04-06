import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { messages, company, role, persona, language, jd, resumeText, currentCode, currentCodeLanguage } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages are required.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured.' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const personaPrompts = {
      'The Skeptic': `You're a sharp, detail-oriented interviewer who doesn't let things slide. You dig into every claim, push back on vague answers, and ask pointed follow-ups. You're respectful but direct — think a senior engineering manager who's seen it all. Use natural, modern English. No corporate jargon. Just straight talk.`,
      'The Enthusiast': `You're a genuinely supportive interviewer who wants the candidate to shine, but you're not a pushover. You get excited when someone nails an answer and you're not shy about it — "Oh nice, that's a solid approach." You still ask tough follow-ups, but your vibe is more collaborative than interrogative. Speak like someone the candidate would actually want to work with.`,
      'The Technical Guru': `You live and breathe systems design, architecture, and code. You care about how things scale, break, and recover. You ask questions like "Walk me through how you'd handle this at 10x traffic" or "What's the trade-off you're making here?" You speak fluently and casually — like a staff engineer having a whiteboard chat, not reading from a script.`,
      'The Culture Fit': `You're focused on how people collaborate, communicate, and handle ambiguity. You ask about real situations — conflicts with teammates, tough calls under pressure, moments of failure. You're warm and conversational, making the candidate feel comfortable enough to be honest. Think of a people-oriented lead who genuinely wants to understand who someone is beyond their resume.`
    };

    let languageInstruction = '';
    if (language === 'Hindi') {
      languageInstruction = `\n\nLANGUAGE INSTRUCTION: You MUST conduct the entire interview in Hindi (हिन्दी) using Devanagari script. All your questions, follow-ups, acknowledgements, and feedback must be in Hindi. Do NOT switch to English under any circumstances. The candidate may respond in Hindi or Hinglish — that's fine, but YOUR responses must always be in pure Hindi.`;
    } else if (language === 'Hinglish') {
      languageInstruction = `\n\nLANGUAGE INSTRUCTION: Conduct the interview in Hinglish — a natural mix of Hindi and English, the way young professionals in India actually talk. Use Devanagari for Hindi words and Roman script for English words. Example: "Acha, so tell me about your last project — usme kya challenges aaye the?" Keep it conversational and relatable. Match the candidate's mix level — if they lean more English, you lean more English too.`;
    }

    const systemPrompt = `
      ${personaPrompts[persona] || 'You are a seasoned interviewer with a natural, modern communication style.'}
      You're conducting an interview for a ${role} role at ${company}.
      ${jd ? `\n--- JOB DESCRIPTION ---\n${jd}\n---------------------\nAsk specific questions tailored to these exact requirements.\n` : ''}
      ${resumeText ? `\n--- CANDIDATE RESUME ---\n${resumeText}\n------------------------\nDeeply analyze their resume. Base at least 50% of your questions on specific past experiences, projects, or metrics mentioned here. Don't ask generic questions if you can ask about their specific past work.\n` : ''}
      
      CURVEBALL INSTRUCTION:
      If the interview progresses past the 3rd or 4th turn, randomly inject a high-pressure "curveball" scenario once during the interview. (e.g., "Imagine your budget gets cut by half tomorrow" or "Your lead engineer abruptly quits").
      
      ${currentCode && currentCode.trim() !== '// Write your code here...' ? `\n--- LIVE CANDIDATE CODE (${currentCodeLanguage || 'javascript'}) ---\n${currentCode}\n--------------------------\nThe candidate is currently writing this ${currentCodeLanguage || 'javascript'} code in a live editor. If relevant, comment on it, ask about its time/space complexity, or point out potential bugs.` : ''}

      STYLE GUIDE:
      - Speak in casual American English. Think Silicon Valley / Bay Area interviewer energy.
      - Use American spellings (organize, color, analyze), American idioms ("hit the ground running", "circle back", "deep dive"), and American casual phrases ("awesome", "totally", "for sure", "gotcha", "makes sense").
      - Talk like a real person. Use contractions ("you're", "that's", "I'd", "gonna", "wanna"), natural transitions, and casual connectors ("So", "Alright", "Cool", "Got it", "Yeah").
      - Avoid sounding robotic, overly formal, or British. No "Certainly!", "Indeed!", "Brilliant!", "Quite right!", or "That is correct!".
      - React naturally to answers — brief American-style acknowledgments like "Solid", "Dope", "Nice", "Yeah that tracks", "Okay cool" before moving on.
      - Keep it tight — under 80 words per response. Real interviewers don't monologue.

      INTERVIEW RULES:
      1. Stay in character throughout.
      2. Ask ONE question at a time. No stacking.
      3. Weak answer? Push deeper — "Can you be more specific?" or "What did that actually look like in practice?"
      4. Strong answer? Give a quick nod and pivot — "Love that. Let's switch gears..."
      5. Mix question types: technical, behavioral, situational. Keep it dynamic.
      6. Sound like someone the candidate might actually interview with at a top company.${languageInstruction}
    `;

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      systemInstruction: systemPrompt
    });

    // Format messages for Gemini - ensuring history alternates and starts with user
    const chatMessages = messages.filter(m => m.content && m.content.trim());
    const chatHistory = [];
    
    // Gemini history must start with 'user'. 
    // In our app, stage 'chat' starts with messages = [{role: 'assistant', content: ...}] 
    // but the API was originally called with messages = [userMsg].
    
    for (let i = 0; i < chatMessages.length - 1; i++) {
      const msg = chatMessages[i];
      // Skip assistant messages if they are the first item to maintain valid history
      if (chatHistory.length === 0 && msg.role !== 'user') continue;
      
      chatHistory.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      });
    }

    const chat = model.startChat({
      history: chatHistory,
      generationConfig: {
        maxOutputTokens: 500,
      },
    });

    const lastMessage = chatMessages[chatMessages.length - 1].content;
    let result;
    try {
      result = await chat.sendMessage(lastMessage);
    } catch (err) {
      console.warn('Simulation primary model failed, trying fallbacks...', err);
      const fallbacks = ['gemini-flash-latest', 'gemini-2.0-flash-lite', 'gemini-2.5-flash', 'gemini-pro-latest'];
      let lastErr = err;
      
      for (const modelId of fallbacks) {
        try {
          const fallbackModel = genAI.getGenerativeModel({ 
            model: modelId,
            systemInstruction: systemPrompt
          });
          const fallbackChat = fallbackModel.startChat({ history: chatHistory });
          result = await fallbackChat.sendMessage(lastMessage);
          if (result) break;
        } catch (e) {
          lastErr = e;
          continue;
        }
      }
      if (!result) throw lastErr;
    }

    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ content: text });
  } catch (err) {
    console.error('Simulation API error:', err);
    return NextResponse.json({ error: err.message || 'Simulation failed.' }, { status: 500 });
  }
}
