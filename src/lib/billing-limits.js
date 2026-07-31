import {
  countAnalyses,
  countApplications,
  countPreps,
  getPlan,
} from '@/lib/db';
import { getPlanLimits } from '@/lib/stripe';

const counters = {
  applications: countApplications,
  analyses: countAnalyses,
  preps: countPreps,
};

export function assertWithinPlanLimit(userId, resource) {
  const plan = getPlan(userId);
  const limits = getPlanLimits(plan);
  const limit = limits[resource];
  const count = counters[resource]?.(userId) || 0;

  if (typeof limit === 'number' && count >= limit) {
    return {
      allowed: false,
      status: 403,
      error: `Your ${plan} plan allows ${limit} ${resource}. Upgrade to add more.`,
      plan,
      limit,
      count,
    };
  }

  return { allowed: true, plan, limit, count };
}
