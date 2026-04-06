'use client';
import { useUser } from '@clerk/nextjs';
import Sidebar from '@/components/Sidebar';
import { Check, Sparkles } from 'lucide-react';
import { useBilling } from '@/hooks/useBilling';
import { savePlan } from '@/lib/store';

const PLANS = [
  {
    name: 'Free',
    price: 0,
    period: 'forever',
    features: [
      'Up to 20 logged applications',
      '3 resume analyses / month',
      'Personal funnel charts',
      'Market benchmarks (basic)',
    ],
    cta: 'Current Plan',
    featured: false,
    disabled: true,
  },
  {
    name: 'Pro',
    price: 9,
    period: '/month',
    features: [
      'Unlimited applications',
      'Unlimited resume analyses',
      'Advanced AI coaching',
      'Full benchmark data',
      'Export data',
      'Priority support',
    ],
    cta: 'Upgrade to Pro',
    featured: true,
    disabled: false,
  },
  {
    name: 'Team',
    price: 29,
    period: '/month',
    features: [
      'Everything in Pro',
      'Up to 5 team members',
      'Shared benchmark insights',
      'Aggregate team analytics',
    ],
    cta: 'Contact Sales',
    featured: false,
    disabled: false,
  },
];

export default function BillingPage() {
  const { user, isLoaded } = useUser();
  const { plan: currentPlan } = useBilling();

  const handlePlanChange = (planName) => {
    if (!user) return;
    const newPlan = planName.toLowerCase();
    savePlan(user.id, newPlan);
    // Reload to apply new limits across hooks
    window.location.reload();
  };

  if (!isLoaded) return null;

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-container">
          <div className="page-header" style={{ textAlign: 'center', maxWidth: '560px', margin: '0 auto 48px' }}>
            <h1 className="page-title">Simple, honest pricing</h1>
            <p className="page-subtitle" style={{ marginTop: '8px' }}>Start for free. Upgrade when you&rsquo;re ready.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', maxWidth: '900px', margin: '0 auto' }}>
            {PLANS.map(plan => (
              <div key={plan.name} className={`billing-card ${plan.featured ? 'featured' : ''}`}>
                {plan.featured && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '-8px' }}>
                    <Sparkles size={12} color="var(--accent)" />
                    <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Recommended</span>
                  </div>
                )}
                <div>
                  <div className="billing-plan-name">{plan.name}</div>
                  <div className="billing-price" style={{ marginTop: '8px' }}>
                    {plan.price === 0 ? 'Free' : `$${plan.price}`}
                    <span>{plan.period !== 'forever' ? plan.period : ''}</span>
                  </div>
                  {plan.period === 'forever' && (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>forever</div>
                  )}
                </div>

                <ul className="billing-features">
                  {plan.features.map(f => (
                    <li key={f}>
                      <Check size={13} color="var(--accent)" />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handlePlanChange(plan.name)}
                  className={`btn btn-full ${plan.name.toLowerCase() === currentPlan ? 'btn-ghost' : plan.featured ? 'btn-primary' : 'btn-ghost'}`}
                  disabled={plan.name.toLowerCase() === currentPlan}
                  style={{ opacity: plan.name.toLowerCase() === currentPlan ? 0.5 : 1, marginTop: 'auto', border: plan.name.toLowerCase() === currentPlan ? 'var(--border)' : '' }}
                >
                  {plan.name.toLowerCase() === currentPlan ? 'Current Plan' : plan.name.toLowerCase() === 'free' ? 'Downgrade to Free' : plan.cta}
                </button>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '48px', padding: '24px', border: 'var(--border)', borderRadius: 'var(--radius)', maxWidth: '560px', margin: '48px auto 0' }}>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              All plans include a <strong>14-day free trial</strong> of Pro features. No credit card required.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
