import { auth } from '@clerk/nextjs/server';
import { getApplicationById, updateApplication, deleteApplication } from '@/lib/db';
import { emitToUserApps, SocketEvents } from '@/lib/socket';

export async function GET(request, { params }) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const app = getApplicationById(userId, params.id);
  if (!app) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json(app);
}

export async function PATCH(request, { params }) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();
  const app = updateApplication(userId, params.id, body);
  if (!app) return Response.json({ error: 'Not found' }, { status: 404 });
  emitToUserApps(userId, SocketEvents.APPLICATION_UPDATED, app);
  return Response.json(app);
}

export async function DELETE(request, { params }) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  deleteApplication(userId, params.id);
  emitToUserApps(userId, SocketEvents.APPLICATION_DELETED, { id: params.id });
  return Response.json({ success: true });
}
