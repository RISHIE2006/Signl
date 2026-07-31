import { auth } from '@clerk/nextjs/server';
import { getDNA, saveDNA } from '@/lib/db';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const data = getDNA(userId);
  return Response.json(data || {});
}

export async function POST(request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();
  saveDNA(userId, body);
  return Response.json({ success: true });
}
