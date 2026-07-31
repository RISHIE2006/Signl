import { auth } from '@clerk/nextjs/server';
import { getStripe } from '@/lib/stripe';
import { getSubscription } from '@/lib/db';

export async function POST(request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const stripe = getStripe();
  if (!stripe) return Response.json({ error: 'Payment not configured' }, { status: 503 });

  try {
    const subscription = getSubscription(userId);
    if (!subscription?.stripeCustomerId) {
      return Response.json({ error: 'No Stripe customer found' }, { status: 400 });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${request.headers.get('origin')}/billing`,
    });
    return Response.json({ url: session.url });
  } catch (err) {
    return Response.json({ error: err.message || 'Failed to open billing portal' }, { status: 500 });
  }
}
