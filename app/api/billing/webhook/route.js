import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
// Note: In a real app, you'd use a database like Appwrite or Prisma here.
// Since this project currently uses localStorage (client-side), 
// we would ideally update Clerk user metadata or a backend DB.

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req) {
  const body = await req.text();
  const signature = (await headers()).get('stripe-signature');

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: 'Webhook Error' }, { status: 400 });
  }

  const session = event.data.object;

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const userId = session.client_reference_id;
    const planName = session.metadata.planName;

    console.log(`User ${userId} successfully subscribed to ${planName}`);
    
    // TODO: Update user's plan in your database/Clerk metadata
    // Example with Clerk (if using clerk-sdk-node):
    // await clerk.users.updateUserMetadata(userId, {
    //   publicMetadata: { plan: planName }
    // });
  }

  return NextResponse.json({ received: true });
}
