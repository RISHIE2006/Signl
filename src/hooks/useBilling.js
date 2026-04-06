'use client';
import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { getPlan, getApplications, getAnalyses, getPreps } from '@/lib/store';

export function useBilling() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [plan, setPlan] = useState('free');
  
  // Usage tracking
  const [appsCount, setAppsCount] = useState(0);
  const [analysesCount, setAnalysesCount] = useState(0);
  const [prepsCount, setPrepsCount] = useState(0);

  // Limits
  const FREE_APPS_LIMIT = 20;
  const FREE_ANALYSES_LIMIT = 3;
  const FREE_PREPS_LIMIT = 1;

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      const currentPlan = getPlan(user.id);
      setPlan(currentPlan);

      // Only count usage if they are on the free plan, to save performance (optional but good practice)
      if (currentPlan === 'free') {
        setAppsCount(getApplications(user.id).length);
        setAnalysesCount(getAnalyses(user.id).length);
        setPrepsCount(getPreps(user.id).length);
      }
    }
  }, [isLoaded, isSignedIn, user]);

  const isPro = plan === 'pro' || plan === 'team';
  const isTeam = plan === 'team';

  // Feature Gating Checks
  const canAddApplication = isPro || appsCount < FREE_APPS_LIMIT;
  const canAddAnalysis = isPro || analysesCount < FREE_ANALYSES_LIMIT;
  const canStartPrep = isPro || prepsCount < FREE_PREPS_LIMIT;

  return {
    plan,
    isPro,
    isTeam,
    usage: {
      appsCount,
      analysesCount,
      prepsCount
    },
    limits: {
      appsLimit: FREE_APPS_LIMIT,
      analysesLimit: FREE_ANALYSES_LIMIT,
      prepsLimit: FREE_PREPS_LIMIT
    },
    canAddApplication,
    canAddAnalysis,
    canStartPrep
  };
}
