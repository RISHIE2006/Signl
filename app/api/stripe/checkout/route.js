import { auth } from '@clerk/nextjs/server';
import { currentUser } from '@clerk/nextjs/server';
import { getStripe, PLANS } from '@/lib/stripe';
import { getSubscription, saveStripeCustomer } from '@/lib/db';

export async function POST(request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { plan } = await request.json();
    const planConfig = PLANS[plan];
    if (!planConfig || !planConfig.priceId) {
      return Response.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const stripe = getStripe();
    if (!stripe) {
      return Response.json({ error: 'Payment not configured' }, { status: 503 });
    }

    const subscription = getSubscription(userId);
    let customerId = subscription?.stripeCustomerId;

    if (!customerId) {
      const user = await currentUser();
      const customer = await stripe.customers.create({
        email: user?.primaryEmailAddress?.emailAddress,
        name: user?.fullName || undefined,
        metadata: { userId },
      });
      customerId = customer.id;
      saveStripeCustomer(userId, customerId);
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: planConfig.priceId, quantity: 1 }],
      success_url: `${request.headers.get('origin')}/billing?success=true&plan=${plan}`,
      cancel_url: `${request.headers.get('origin')}/billing?canceled=true`,
      client_reference_id: userId,
      metadata: { userId, plan },
      subscription_data: {
        metadata: { userId, plan },
      },
    });

    return Response.json({ url: session.url });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
