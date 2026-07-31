import { NextResponse } from 'next/server';
import { getStripe, toSubscriptionRecord } from '@/lib/stripe';
import {
  getSubscriptionByStripeSubscriptionId,
  saveStripeCustomer,
  saveSubscription,
} from '@/lib/db';

export async function POST(request) {
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: 'Not configured' }, { status: 503 });

  const body = await request.text();
  const sig = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.userId || session.client_reference_id;
        if (userId && session.customer) saveStripeCustomer(userId, session.customer);
        if (userId && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          saveSubscription(userId, toSubscriptionRecord(subscription, {
            stripeCustomerId: session.customer,
            plan: session.metadata?.plan,
          }));
        }
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const existing = getSubscriptionByStripeSubscriptionId(subscription.id);
        const userId = subscription.metadata?.userId || existing?.userId;
        if (userId) {
          saveSubscription(userId, toSubscriptionRecord(subscription));
        }
        break;
      }
    }
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
