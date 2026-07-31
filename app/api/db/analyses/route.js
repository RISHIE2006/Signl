import { auth } from '@clerk/nextjs/server';
import { getAnalyses, addAnalysis } from '@/lib/db';
import { assertWithinPlanLimit } from '@/lib/billing-limits';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const analyses = getAnalyses(userId);
  return Response.json(analyses);
}

export async function POST(request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const limit = assertWithinPlanLimit(userId, 'analyses');
  if (!limit.allowed) return Response.json(limit, { status: limit.status });
  const body = await request.json();
  const analysis = addAnalysis(userId, body);
  return Response.json(analysis, { status: 201 });
}
