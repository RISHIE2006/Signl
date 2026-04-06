'use client';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { getApplications, getProfile } from '@/lib/store';
import { FilePlus, Sparkles, TrendingUp, Target, Activity, Zap, ScanSearch, ArrowRight, BrainCircuit, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useBilling } from '@/hooks/useBilling';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const item = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } }
};

/* ── 3D Quick Action Card ─────────────────────────────── */
function QuickCard({ href, icon: Icon, iconColor, iconBg, title, subtitle }) {
  return (
    <motion.div variants={item}>
      <Link href={href} style={{ textDecoration: 'none' }}>
        <motion.div
          whileHover={{ y: -2, background: 'var(--bg-hover)' }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2 }}
          style={{
            display: 'flex', alignItems: 'center', gap: '16px',
            padding: '20px 22px', borderRadius: '14px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            cursor: 'pointer', position: 'relative',
          }}
        >
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: iconBg, color: iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', fontWeight: '700', letterSpacing: '-0.01em' }}>{title}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{subtitle}</div>
          </div>
          <ArrowRight size={14} color="var(--text-muted)" />
        </motion.div>
      </Link>
    </motion.div>
  );
}

/* ── Metric Card ───────────────────────────────────────── */
function MetricCard({ icon: Icon, value, label }) {
  return (
    <motion.div variants={item}>
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2 }}
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '14px', padding: '28px 24px',
          textAlign: 'center', position: 'relative',
        }}
      >
        <Icon size={18} color="var(--text-muted)" style={{ margin: '0 auto 12px', display: 'block' }} />
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            fontSize: '36px', fontWeight: '800', letterSpacing: '-0.03em', lineHeight: 1,
            color: 'var(--text-primary)',
          }}
        >
          {value}
        </motion.div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700' }}>{label}</div>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const { plan } = useBilling();

  const [profile, setProfile]   = useState(null);
  const [apps, setApps]         = useState([]);
  const [insight, setInsight]   = useState('Analysing your applications…');

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) { router.push('/sign-in'); return; }
    const p = getProfile(user.id);
    if (!p) { router.push('/onboarding'); return; }
    setProfile(p);
    const a = getApplications(user.id);
    setApps(a);

    async function fetchInsight() {
      if (a.length === 0) { setInsight('Log some applications to see patterns emerge.'); return; }
      try {
        const res = await fetch('/api/insight', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ applications: a }) });
        const data = await res.json();
        setInsight(data.insight || 'Keep applying! Add more data to uncover deeper patterns in your rejection reasons.');
      } catch { setInsight('Could not load AI insight right now.'); }
    }
    fetchInsight();
  }, [user, isLoaded, router]);

  if (!isLoaded || !profile) return null;

  const total   = apps.length;
  const screens = apps.filter(a => ['HR Screen','Technical','Final Round'].includes(a.stage)).length;
  const finals  = apps.filter(a => a.stage === 'Final Round').length;
  const stages  = [{ name: 'Applied', count: total }, { name: 'Screening', count: screens }, { name: 'Final Round', count: finals }];

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-container">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}
          >
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', gap: '10px' }}>
                Welcome back, {user.firstName || 'there'} 👋
                {plan !== 'free' && (
                  <span style={{ fontSize: '10px', padding: '3px 10px', borderRadius: '100px', background: 'linear-gradient(135deg, var(--accent-light), var(--accent))', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '700', boxShadow: '0 4px 12px rgba(var(--accent-rgb),0.35)' }}>
                    {plan}
                  </span>
                )}
              </h1>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>Here is your application funnel this month.</p>
            </div>
            <Link href="/log" className="btn btn-primary" style={{ borderRadius: '100px', padding: '11px 22px' }}>
              <FilePlus size={15} /> Log Application
            </Link>
          </motion.div>

          {/* Metrics */}
          <motion.div variants={container} initial="hidden" animate="show" className="grid-3" style={{ marginBottom: '24px' }}>
            <MetricCard icon={Activity}    value={total}   label="Total Applications" />
            <MetricCard icon={Target}      value={`${total > 0 ? Math.round((screens / total) * 100) : 0}%`} label="Screening Rate" />
            <MetricCard icon={TrendingUp}  value={`${screens > 0 ? Math.round((finals / screens) * 100) : 0}%`} label="Final Stage Conversion" />
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={container} initial="hidden" animate="show" className="grid-3" style={{ marginBottom: '24px' }}>
            <QuickCard href="/prep-voice"  icon={Zap}           iconColor="var(--accent)"  iconBg="rgba(var(--accent-rgb),0.1)"  title="Voice Interview"  subtitle="Practice with AI voice coach" />
            <QuickCard href="/simulation"  icon={MessageSquare} iconColor="#8B5CF6"         iconBg="rgba(139,92,246,0.1)"         title="Live Sandbox"     subtitle="Full mock interview session" />
            <QuickCard href="/extension"   icon={ScanSearch}    iconColor="var(--text-primary)" iconBg="var(--bg-secondary)"      title="Browser Mod"      subtitle="LinkedIn Match Overlay" />
          </motion.div>

          {/* Funnel + AI Insight */}
          <motion.div variants={container} initial="hidden" animate="show" className="grid-2" style={{ alignItems: 'start' }}>

            {/* Funnel Drop-off */}
            <motion.div variants={item}>
              <motion.div
                whileHover={{ boxShadow: 'var(--shadow-lg), var(--shadow-inset)' }}
                style={{ background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.6)', boxShadow: 'var(--shadow-sm), var(--shadow-inset)', borderRadius: '16px', padding: '28px', position: 'relative', overflow: 'hidden' }}
              >
                <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)' }} />
                <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '24px', letterSpacing: '-0.02em' }}>Funnel Drop-off</h3>
                {total === 0 ? (
                  <div className="empty-state" style={{ padding: '30px 0' }}>
                    <p>Your funnel is empty. Log an application to see data.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {stages.map((st, i) => {
                      const pct = total > 0 ? Math.max((st.count / total) * 100, 2) : 0;
                      const drop = i > 0 ? stages[i - 1].count - st.count : 0;
                      return (
                        <div key={st.name} className="funnel-row">
                          <div className="funnel-stage-name">{st.name}</div>
                          <div className="funnel-bar-wrap">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.9, delay: 0.3 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                              className="funnel-bar"
                            />
                          </div>
                          <div className="funnel-count">{st.count}</div>
                          <div className="funnel-dropoff">{i > 0 && drop > 0 ? `-${drop}` : ''}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            </motion.div>

            {/* AI Insight */}
            <motion.div variants={item}>
              <motion.div
                whileHover={{ y: -4, boxShadow: 'var(--shadow-lg)' }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                style={{
                  borderRadius: '16px', padding: '28px',
                  background: 'linear-gradient(135deg, rgba(var(--accent-rgb),0.08) 0%, var(--bg-secondary) 100%)',
                  border: '1px solid rgba(var(--accent-rgb),0.15)',
                  boxShadow: 'var(--shadow-sm), inset 0 1px 0 rgba(255,255,255,0.5)',
                  position: 'relative', overflow: 'hidden',
                }}
              >
                {/* Decorative orb */}
                <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '140px', height: '140px', background: 'radial-gradient(circle, rgba(var(--accent-rgb),0.15) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(20px)', pointerEvents: 'none' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
                    <Sparkles size={16} color="var(--accent)" />
                  </motion.div>
                  <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)' }}>AI Coach Insight</span>
                </div>
                <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.7', position: 'relative', zIndex: 1 }}>
                  {insight}
                </p>

                <div style={{ marginTop: '24px', display: 'flex', gap: '8px', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
                  <Link href="/prep" className="btn btn-primary btn-sm" style={{ borderRadius: '100px' }}>
                    <BrainCircuit size={13} /> Interview Prep
                  </Link>
                  <Link href="/analyse" className="btn btn-ghost btn-sm" style={{ borderRadius: '100px', fontSize: '12px' }}>
                    Analyse Resume <ArrowRight size={12} />
                  </Link>
                </div>
              </motion.div>
            </motion.div>

          </motion.div>
        </div>
      </main>
    </div>
  );
}
