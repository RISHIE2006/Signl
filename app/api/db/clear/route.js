import { auth } from '@clerk/nextjs/server';
import { clearAllData } from '@/lib/db';

export async function DELETE() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  clearAllData(userId);
  return Response.json({ success: true, message: 'All data cleared' });
}
