import { auth } from '@clerk/nextjs/server';
import { getPreps, addPrep, deletePrep } from '@/lib/db';
import { assertWithinPlanLimit } from '@/lib/billing-limits';
import { emitToUserApps, SocketEvents } from '@/lib/socket';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const preps = getPreps(userId);
  return Response.json(preps);
}

export async function POST(request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const limit = assertWithinPlanLimit(userId, 'preps');
  if (!limit.allowed) return Response.json(limit, { status: limit.status });
  const body = await request.json();
  const prep = addPrep(userId, body);
  emitToUserApps(userId, SocketEvents.PREP_CREATED, prep);
  return Response.json(prep, { status: 201 });
}

export async function DELETE(request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await request.json();
  deletePrep(userId, id);
  emitToUserApps(userId, SocketEvents.APPLICATION_DELETED, { id });
  return Response.json({ success: true });
}
