import { NextResponse } from 'next/server';
import { generateWithFallback } from '@/lib/grok';

const OFFLINE_BENCHMARKS = {
  marketAvgSuccessRate: 6,
  avgTechnicalDropoff: 54,
  sectors: [
    { name: 'Top Tech (avg)', resumeDropoff: 82, technicalDropoff: 58, finalDropoff: 24 },
    { name: 'Startups (avg)', resumeDropoff: 68, technicalDropoff: 46, finalDropoff: 19 },
    { name: 'Consulting (avg)', resumeDropoff: 74, technicalDropoff: 51, finalDropoff: 21 },
    { name: 'Finance (avg)', resumeDropoff: 77, technicalDropoff: 55, finalDropoff: 23 },
  ],
};

function json(data, status = 200) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

function normalize(data) {
  if (!data || !Number.isFinite(Number(data.marketAvgSuccessRate)) || !Array.isArray(data.sectors)) {
    throw new Error('Invalid benchmark response');
  }
  return {
    marketAvgSuccessRate: Math.round(Number(data.marketAvgSuccessRate)),
    avgTechnicalDropoff: Math.round(Number(data.avgTechnicalDropoff) || OFFLINE_BENCHMARKS.avgTechnicalDropoff),
    sectors: data.sectors.slice(0, 4).map((sector) => ({
      name: String(sector.name || 'Unknown'),
      resumeDropoff: Math.round(Number(sector.resumeDropoff) || 0),
      technicalDropoff: Math.round(Number(sector.technicalDropoff) || 0),
      finalDropoff: Math.round(Number(sector.finalDropoff) || 0),
    })),
  };
}

export async function GET() {
  return json({ ...OFFLINE_BENCHMARKS, fetchedAt: new Date().toISOString(), source: 'offline' });
}

export async function OPTIONS() {
  return new Response(null, { status: 204 });
}

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

    let text;
    try {
      text = await generateWithFallback(prompt);
    } catch (providerError) {
      console.warn('Benchmarks provider unavailable; using offline data:', providerError.message);
      return json({ ...OFFLINE_BENCHMARKS, fetchedAt: new Date().toISOString(), source: 'offline' });
    }
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

    return json({ ...normalize(parsed), source: 'ai' });
  } catch (err) {
    console.error('Benchmarks API error:', err);
    return json({ ...OFFLINE_BENCHMARKS, fetchedAt: new Date().toISOString(), source: 'offline', warning: err.message }, 200);
  }
}
