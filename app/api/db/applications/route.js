import { auth } from '@clerk/nextjs/server';
import { getApplications, addApplication } from '@/lib/db';
import { assertWithinPlanLimit } from '@/lib/billing-limits';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const apps = getApplications(userId);
  return Response.json(apps);
}

export async function POST(request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const limit = assertWithinPlanLimit(userId, 'applications');
  if (!limit.allowed) return Response.json(limit, { status: limit.status });
  const body = await request.json();
  const app = addApplication(userId, body);
  return Response.json(app, { status: 201 });
}
