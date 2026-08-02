import { NextResponse } from 'next/server';
import { generateWithFallback } from '@/lib/grok';

export async function POST(req) {
  try {
    const { applications } = await req.json();
    if (!applications || applications.length === 0) return NextResponse.json({ insight: '' });

    const summary = applications.map(a => `${a.company} - ${a.role} (${a.stage})`).join(', ');
    const prompt = `You are a calm, supportive career coach. A job seeker has logged the following applications: ${summary}.

In 2 sentences, give them ONE specific, actionable coaching insight based on visible patterns. Be non-judgmental. Focus on what they can do next. Do not use generic advice. Return only the insight text, no preamble.`;

    const text = await generateWithFallback(prompt);
    return NextResponse.json({ insight: text.trim() });
  } catch {
    return NextResponse.json({ insight: '' });
  }
}
