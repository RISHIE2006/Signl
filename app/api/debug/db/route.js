import { getDebugDatabaseSnapshot } from '@/src/lib/debug-db';

export async function GET() {
  return Response.json(getDebugDatabaseSnapshot());
}
