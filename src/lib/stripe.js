import Stripe from 'stripe';

const stripeKey = process.env.STRIPE_SECRET_KEY;
let stripeInstance = null;

export function getStripe() {
  if (!stripeKey) return null;
  if (stripeInstance) return stripeInstance;
  stripeInstance = new Stripe(stripeKey, { apiVersion: '2025-03-31.basil' });
  return stripeInstance;
}

export const PLANS = {
  free: {
    name: 'Free',
    priceId: null,
    price: 0,
    limits: { applications: 20, analyses: 3, preps: 1 },
  },
  pro: {
    name: 'Pro',
    priceId: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_monthly',
    price: 19,
    limits: { applications: 200, analyses: 50, preps: 30 },
  },
  team: {
    name: 'Team',
    priceId: process.env.STRIPE_TEAM_PRICE_ID || 'price_team_monthly',
    price: 49,
    limits: { applications: 1000, analyses: 200, preps: 100 },
  },
};

export function getPlanLimits(planId) {
  return PLANS[planId]?.limits || PLANS.free.limits;
}

export function getPlanFromPriceId(priceId) {
  return Object.entries(PLANS).find(([, plan]) => plan.priceId === priceId)?.[0] || 'free';
}

export function getCurrentPeriodEnd(subscription) {
  const timestamp =
    subscription.current_period_end ||
    subscription.items?.data?.[0]?.current_period_end ||
    null;
  return timestamp ? new Date(timestamp * 1000).toISOString() : null;
}

export function toSubscriptionRecord(subscription, fallback = {}) {
  const priceId = subscription.items?.data?.[0]?.price?.id || fallback.priceId || null;
  const plan = fallback.plan || getPlanFromPriceId(priceId);
  return {
    stripeCustomerId:
      typeof subscription.customer === 'string'
        ? subscription.customer
        : subscription.customer?.id || fallback.stripeCustomerId || null,
    stripeSubscriptionId: subscription.id || fallback.stripeSubscriptionId || null,
    plan,
    status: subscription.status || fallback.status || 'inactive',
    priceId,
    currentPeriodEnd: getCurrentPeriodEnd(subscription),
    cancelAtPeriodEnd: !!subscription.cancel_at_period_end,
  };
}
