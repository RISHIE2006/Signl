import { NextResponse } from 'next/server';
import { generateWithFallback } from '@/lib/grok';

export async function POST(req) {
  try {
    const { roles } = await req.json();

    const rolesContext = roles && roles.length > 0 
      ? `The user primarily applies for these roles: ${roles.join(', ')}.` 
      : 'The user applies for general tech/business roles.';

    const prompt = `You are an elite talent acquisition expert and data analyst with access to current real-world hiring market statistics.
${rolesContext}

Generate highly realistic, up-to-date market benchmarks for application success and drop-off rates at different hiring stages. 
Return ONLY valid JSON (no markdown, no backticks, no explanations) in exactly this format:
{
  "marketAvgSuccessRate": <integer percentage representing offer rate from total applications>,
  "avgTechnicalDropoff": <integer percentage representing drop-off at technical/skills stage>,
  "sectors": [
    {
      "name": "Top Tech (avg)",
      "resumeDropoff": <integer %>,
      "technicalDropoff": <integer %>,
      "finalDropoff": <integer %>
    },
    {
      "name": "Startups (avg)",
      "resumeDropoff": <integer %>,
      "technicalDropoff": <integer %>,
      "finalDropoff": <integer %>
    },
    {
      "name": "Consulting (avg)",
      "resumeDropoff": <integer %>,
      "technicalDropoff": <integer %>,
      "finalDropoff": <integer %>
    },
    {
      "name": "Finance (avg)",
      "resumeDropoff": <integer %>,
      "technicalDropoff": <integer %>,
      "finalDropoff": <integer %>
    }
  ]
}

Rules:
- The stats should reflect the current competitive job market logically (e.g. Resume drop-off is usually highest, Offer rate is usually very low like 2-15%).
- Ensure the JSON is perfectly formatted.`;

    const text = await generateWithFallback(prompt);
    let parsed;

    try {
      parsed = JSON.parse(text);
    } catch (firstParseError) {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return NextResponse.json({ error: 'Could not parse AI response. Try again.' }, { status: 500 });
      }
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch (secondParseError) {
        console.error('Benchmarks parse error:', {
          text,
          firstParseError: firstParseError.message,
          secondParseError: secondParseError.message,
        });
        return NextResponse.json({ error: 'Could not parse AI response. Try again.' }, { status: 500 });
      }
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error('Benchmarks API error:', err);
    return NextResponse.json({ error: err.message || 'Benchmarks generation failed.' }, { status: 500 });
  }
}
