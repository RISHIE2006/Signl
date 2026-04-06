import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { role, company, messages } = await req.json();
    
    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'No interview history found. Please conduct the interview before finishing.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured.' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Format history for the prompt
    const sessionSummary = messages.map((m) => 
      `${m.role === 'user' ? 'Candidate' : 'Interviewer'}: ${m.content}`
    ).join('\n\n');

    const prompt = `
You are an elite executive interview coach. A candidate just finished a mock interview 
for the position of ${role} at ${company}.

Here is the full transcript:
${sessionSummary}

Analyze this interview deeply. Look for:
1. Communication clarity and confidence.
2. Technical depth and accuracy.
3. Behavioral alignment (STAR method usage - Situation, Task, Action, Result).
4. Major strengths and critical gaps.
5. Communication DNA Fingerprint: Thoroughly scan the candidate's transcripts for exact filler words or phrases they overuse (e.g. "like", "basically", "to be honest", "um"). Count them accurately. Estimate their speaking pace and give a breakdown of their behavioral DNA.

Provide a coaching debrief in this exact JSON format:
{
  "overallScore": <number 0-10, one decimal>,
  "starScore": <number 0-100, integer percentage of how well they used the STAR method>,
  "verdict": "<2-3 sentence strategic summary>",
  "strengths": [
    { "title": "<short area>", "description": "<detailed explanation of what was done well>" }
  ],
  "weaknesses": [
    { "title": "<short area>", "description": "<detailed explanation of the gap>" }
  ],
  "topImprovements": [
    { "area": "<skill/area>", "tip": "<specific actionable advice to fix the weakness>" }
  ],
  "practiceTopics": ["<specific topic 1>", "<specific topic 2>", "<specific topic 3>"],
  "followUpEmail": "<professional thank you email tailored to the specific talking points of this interview>",
  "recruiterPitch": "<high-converted LinkedIn message to a recruiter at ${company} highlighting current performance>",
  "studyPlan": [
    { "day": "Day 1", "focus": "<focus area based on weakness>", "action": "<what specifically to study or practice>" },
    { "day": "Day 2", "focus": "<another focus area>", "action": "<actionable task>" },
    { "day": "Day 3", "focus": "<etc>", "action": "<etc>" },
    { "day": "Day 4", "focus": "<etc>", "action": "<etc>" },
    { "day": "Day 5", "focus": "<etc>", "action": "<etc>" },
    { "day": "Day 6", "focus": "<etc>", "action": "<etc>" },
    { "day": "Day 7", "focus": "Mock Interview Simulation", "action": "Retake this exact simulation and focus on improving specific metrics" }
  ],
  "readyToInterview": <boolean>,
  "fingerprint": {
    "radar": {
      "Clarity": <number 0-100>,
      "Technical Depth": <number 0-100>,
      "Conciseness": <number 0-100>,
      "Confidence": <number 0-100>,
      "STAR Structure": <number 0-100>
    },
    "fillers": [
      { "word": "<word>", "count": <integer> }
    ],
    "estimatedWPM": <number 100-180 based on word count per turn>,
    "synthesis": "<2-sentence analysis of their communication DNA (structure, pace, crutches) without judgment>"
  }
}

Avoid generic advice. Be specific to the transcript provided.
Return ONLY valid JSON. Nothing else.
`;

    let result;
    const fallbacks = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-flash-latest', 'gemini-pro-latest'];
    let lastError;

    for (const modelId of fallbacks) {
      try {
        const currentModel = genAI.getGenerativeModel({ model: modelId });
        result = await currentModel.generateContent(prompt);
        if (result) break;
      } catch (err) {
        lastError = err;
        console.warn(`Debrief fallback model ${modelId} failed:`, err.message);
        continue;
      }
    }

    if (!result) throw lastError;

    let text = result.response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('AI response did not contain JSON:', text);
      return NextResponse.json({ error: 'AI returned invalid feedback format' }, { status: 500 });
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return NextResponse.json(parsed);
    } catch (parseError) {
      console.error('Debrief JSON parse error. Raw text:', jsonMatch[0]);
      return NextResponse.json({ error: 'Failed to parse AI feedback' }, { status: 500 });
    }
  } catch (error) {
    console.error('Debrief API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate debrief' }, { status: 500 });
  }
}
