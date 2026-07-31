"use client";
import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Check, Sparkles, Loader } from "lucide-react";
import { useBilling } from "@/hooks/useBilling";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    period: "forever",
    features: [
      "Up to 20 logged applications",
      "3 resume analyses / month",
      "Personal funnel charts",
      "Market benchmarks (basic)",
    ],
    featured: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: 19,
    period: "/month",
    features: [
      "200 applications / month",
      "50 resume analyses / month",
      "30 interview preps / month",
      "Advanced AI coaching insights",
      "Full benchmark data",
      "Priority support",
      "14-day free trial",
    ],
    featured: true,
  },
  {
    id: "team",
    name: "Team",
    price: 49,
    period: "/month",
    features: [
      "Everything in Pro",
      "1000 applications / month",
      "200 analyses / month",
      "100 interview preps / month",
      "Shared team insights",
    ],
    featured: false,
  },
];

export default function BillingPage() {
  const { isLoaded } = useUser();
  const { plan: currentPlan, loading: planLoading } = useBilling();
  const [actionLoading, setActionLoading] = useState(null);
  const [message, setMessage] = useState(null);

  const handleUpgrade = async (planId) => {
    if (planId === "free") {
      if (currentPlan !== "free") {
        await handleManageBilling();
      }
      return;
    }

    setActionLoading(planId);
    setMessage(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setMessage(
          data.error ||
            "Payment system is not configured. Add Stripe keys and price IDs to .env.local",
        );
      }
    } catch {
      setMessage("Failed to initiate checkout. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleManageBilling = async () => {
    setActionLoading("manage");
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setMessage(data.error || "No active billing customer found.");
    } catch {
      setMessage("Failed to open billing portal.");
    } finally {
      setActionLoading(null);
    }
  };

  if (!isLoaded || planLoading) return null;

  const isCurrentPlan = (id) => id === currentPlan;

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-container">
          <div
            className="page-header"
            style={{
              textAlign: "center",
              maxWidth: "560px",
              margin: "0 auto 48px",
            }}
          >
            <h1 className="page-title">Simple, honest pricing</h1>
            <p className="page-subtitle" style={{ marginTop: "8px" }}>
              Start for free. Upgrade when you&rsquo;re ready.
            </p>
          </div>

          {message && (
            <div
              style={{
                maxWidth: "900px",
                margin: "0 auto 20px",
                padding: "12px 16px",
                borderRadius: "10px",
                background: "#DC262615",
                border: "1px solid #DC262625",
                color: "#DC2626",
                fontSize: "13px",
                textAlign: "center",
              }}
            >
              {message}
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "20px",
              maxWidth: "900px",
              margin: "0 auto",
            }}
          >
            {PLANS.map((plan) => {
              const active = isCurrentPlan(plan.id);
              return (
                <div
                  key={plan.name}
                  className={`billing-card ${plan.featured ? "featured" : ""}`}
                  style={{ display: "flex", flexDirection: "column" }}
                >
                  {plan.featured && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        marginBottom: "-8px",
                      }}
                    >
                      <Sparkles size={12} color="var(--accent)" />
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: "600",
                          color: "var(--accent)",
                          textTransform: "uppercase",
                          letterSpacing: "0.07em",
                        }}
                      >
                        Recommended
                      </span>
                    </div>
                  )}
                  <div>
                    <div className="billing-plan-name">{plan.name}</div>
                    <div className="billing-price" style={{ marginTop: "8px" }}>
                      {plan.price === 0 ? "Free" : `$${plan.price}`}
                      <span>
                        {plan.period !== "forever" ? plan.period : ""}
                      </span>
                    </div>
                    {plan.period === "forever" && (
                      <div
                        style={{ fontSize: "12px", color: "var(--text-muted)" }}
                      >
                        forever
                      </div>
                    )}
                  </div>

                  <ul className="billing-features">
                    {plan.features.map((f) => (
                      <li key={f}>
                        <Check size={13} color="var(--accent)" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={actionLoading !== null}
                    className={`btn btn-full ${active ? "btn-ghost" : plan.featured ? "btn-primary" : "btn-ghost"}`}
                    style={{ opacity: active ? 0.5 : 1, marginTop: "auto" }}
                  >
                    {actionLoading === plan.id ? (
                      <>
                        <Loader
                          size={14}
                          className="spin"
                          style={{ marginRight: "6px" }}
                        />{" "}
                        Processing...
                      </>
                    ) : active ? (
                      "Current Plan"
                    ) : plan.id === "free" ? (
                      "Manage in Stripe"
                    ) : (
                      plan.cta || `Upgrade to ${plan.name}`
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {currentPlan && currentPlan !== "free" && (
            <div style={{ textAlign: "center", marginTop: "24px" }}>
              <button
                onClick={handleManageBilling}
                disabled={actionLoading !== null}
                className="btn btn-ghost"
                style={{ fontSize: "13px" }}
              >
                {actionLoading === "manage" ? "Loading..." : "Manage Billing"}
              </button>
            </div>
          )}

          <div
            style={{
              textAlign: "center",
              marginTop: "48px",
              padding: "24px",
              border: "var(--border)",
              borderRadius: "var(--radius)",
              maxWidth: "560px",
              margin: "48px auto 0",
            }}
          >
            <div style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
              All plans include a <strong>14-day free trial</strong> of Pro
              features. No credit card required.
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
