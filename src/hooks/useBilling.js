"use client";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState, startTransition } from "react";

export function useBilling() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [plan, setPlan] = useState("free");
  const [loading, setLoading] = useState(true);
  const [appsCount, setAppsCount] = useState(0);
  const [analysesCount, setAnalysesCount] = useState(0);
  const [prepsCount, setPrepsCount] = useState(0);

  const FREE_APPS_LIMIT = 20;
  const FREE_ANALYSES_LIMIT = 3;
  const FREE_PREPS_LIMIT = 1;

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      fetch("/api/db/plan")
        .then((r) => r.json())
        .then((data) => {
          startTransition(() => {
            setPlan(data.plan || "free");
            startTransition(() => setLoading(false));
          });
        })
        .catch(() => {
          startTransition(() => setLoading(false));
        });

      fetch("/api/db/applications")
        .then((r) => r.json())
        .then((data) => startTransition(() => setAppsCount(data.length || 0)))
        .catch(() => {});
      fetch("/api/db/analyses")
        .then((r) => r.json())
        .then((data) =>
          startTransition(() => setAnalysesCount(data.length || 0)),
        )
        .catch(() => {});
      fetch("/api/db/preps")
        .then((r) => r.json())
        .then((data) =>
          startTransition(() => setPrepsCount(data.length || 0)),
        )
        .catch(() => {});
    } else if (isLoaded && !isSignedIn) {
      startTransition(() => setLoading(false));
    }
  }, [isLoaded, isSignedIn, user]);

  const isPro = plan === "pro" || plan === "team";
  const isTeam = plan === "team";

  const canAddApplication = isPro || appsCount < FREE_APPS_LIMIT;
  const canAddAnalysis = isPro || analysesCount < FREE_ANALYSES_LIMIT;
  const canStartPrep = isPro || prepsCount < FREE_PREPS_LIMIT;

  return {
    plan,
    loading,
    isPro,
    isTeam,
    usage: { appsCount, analysesCount, prepsCount },
    limits: {
      appsLimit: FREE_APPS_LIMIT,
      analysesLimit: FREE_ANALYSES_LIMIT,
      prepsLimit: FREE_PREPS_LIMIT,
    },
    canAddApplication,
    canAddAnalysis,
    canStartPrep,
  };
}
