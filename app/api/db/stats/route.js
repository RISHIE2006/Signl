import { auth } from '@clerk/nextjs/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const appCount = db.prepare('SELECT COUNT(*) as count FROM applications WHERE user_id = ?').get(userId).count;
  const analysisCount = db.prepare('SELECT COUNT(*) as count FROM analyses WHERE user_id = ?').get(userId).count;
  const prepCount = db.prepare('SELECT COUNT(*) as count FROM preps WHERE user_id = ?').get(userId).count;
  const hasResume = !!db.prepare('SELECT 1 FROM resumes WHERE user_id = ?').get(userId);
  const hasProfile = !!db.prepare('SELECT 1 FROM profiles WHERE user_id = ?').get(userId);
  const plan = db.prepare('SELECT plan FROM plans WHERE user_id = ?').get(userId);

  return Response.json({
    applications: appCount,
    analyses: analysisCount,
    preps: prepCount,
    hasResume,
    hasProfile,
    plan: plan ? plan.plan : 'free',
    database: 'SQLite',
    location: 'data/signl.db',
  });
}
