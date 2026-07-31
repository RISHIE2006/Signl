import { auth } from '@clerk/nextjs/server';
import { getPlan, getSubscription } from '@/lib/db';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const plan = getPlan(userId);
  const subscription = getSubscription(userId);
  return Response.json({
    plan,
    subscription: subscription
      ? {
          status: subscription.status,
          currentPeriodEnd: subscription.currentPeriodEnd,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        }
      : null,
  });
}

export async function POST() {
  return Response.json(
    { error: 'Plan changes must be processed through Stripe checkout or webhooks.' },
    { status: 403 },
  );
}
