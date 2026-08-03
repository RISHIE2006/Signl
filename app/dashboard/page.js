'use client';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { fetchApplications, fetchProfile } from '@/lib/api-store';
import { FilePlus, Sparkles, TrendingUp, Target, Activity, Zap, ScanSearch, ArrowRight, BrainCircuit, MessageSquare, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, startTransition, useMemo } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useScroll } from 'framer-motion';
import { useBilling } from '@/hooks/useBilling';

const springEase = [0.16, 1, 0.3, 1];

/* ── Floating Depth Particles ─────────────────────────────────── */
function FloatingParticles() {
  const { scrollYProgress } = useScroll();
  const yOffset = useTransform(scrollYProgress, [0, 1], [0, -40]);
  const dots = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    size: 2 + (i % 3) * 2,
    x: 5 + (i * 53) % 90,
    y: 8 + (i * 37) % 85,
    speed: 0.4 + (i % 4) * 0.12,
    delay: (i * 0.9) % 5,
    opacity: 0.03 + (i % 3) * 0.025,
  })), []);

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      {dots.map((d, i) => (
        <motion.div key={i} style={{ y: yOffset }}>
          <motion.div
            animate={{ y: [0, -15, 0, 10, 0], x: [0, 6, -3, -6, 0] }}
            transition={{ duration: 7 + d.speed * 5, repeat: Infinity, delay: d.delay, ease: 'easeInOut' }}
            style={{
              position: 'absolute', left: `${d.x}%`, top: `${d.y}%`,
              width: d.size, height: d.size, borderRadius: '50%',
              background: 'var(--accent)', opacity: d.opacity,
            }}
          />
        </motion.div>
      ))}
    </div>
  );
}

/* ── 3D Tilt Card ────────────────────────────────────────── */
function TiltCard({ children, style, hoverLift = -4 }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mx = useSpring(x, { stiffness: 120, damping: 18 });
  const my = useSpring(y, { stiffness: 120, damping: 18 });
  const rotateX = useTransform(my, [-0.5, 0.5], ['2deg', '-2deg']);
  const rotateY = useTransform(mx, [-0.5, 0.5], ['-2deg', '2deg']);

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - r.left) / r.width - 0.5);
    y.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => { x.set(0); y.set(0); };

  return (
    <motion.div
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      whileHover={{ y: hoverLift }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      style={{
        rotateX, rotateY, transformStyle: 'preserve-3d', perspective: '900px',
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
}

/* ── Quick Action Card ──────────────────────────────────── */
function QuickCard({ href, icon: Icon, iconColor, iconBg, title, subtitle }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: springEase }}
    >
      <Link href={href} style={{ textDecoration: 'none' }}>
        <TiltCard>
          <motion.div
            whileHover={{ background: 'var(--bg-hover)' }}
            whileTap={{ scale: 0.98 }}
            style={{
              display: 'flex', alignItems: 'center', gap: '16px',
              padding: '20px 22px', borderRadius: '14px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              cursor: 'pointer', position: 'relative',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <motion.div
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              style={{ width: '40px', height: '40px', borderRadius: '12px', background: iconBg, color: iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            >
              <Icon size={18} />
            </motion.div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: '700', letterSpacing: '-0.01em' }}>{title}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{subtitle}</div>
            </div>
            <ArrowRight size={14} color="var(--text-muted)" />
          </motion.div>
        </TiltCard>
      </Link>
    </motion.div>
  );
}

/* ── Metric Card ────────────────────────────────────────── */
function MetricCard({ icon: Icon, value, label }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: springEase }}
    >
      <TiltCard hoverLift={-3}>
        <motion.div
          whileHover={{ boxShadow: 'var(--shadow-md)' }}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '14px', padding: '28px 24px',
            textAlign: 'center', position: 'relative',
            boxShadow: 'var(--shadow-xs)',
            overflow: 'hidden',
          }}
        >
          <motion.div
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute', top: '-20px', right: '-20px',
              width: '80px', height: '80px',
              background: 'radial-gradient(circle, rgba(var(--accent-rgb),0.08) 0%, transparent 70%)',
              borderRadius: '50%', pointerEvents: 'none',
            }}
          />
          <motion.div
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          >
            <Icon size={18} color="var(--accent)" style={{ margin: '0 auto 12px', display: 'block' }} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{
              fontSize: '36px', fontWeight: '800', letterSpacing: '-0.03em', lineHeight: 1,
              color: 'var(--text-primary)',
            }}
          >
            {value}
          </motion.div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700' }}>{label}</div>
        </motion.div>
      </TiltCard>
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

    async function loadData() {
      const uId = user?.id || 'demo_user';
      let p = await fetchProfile(uId);
      if ((!p || !p.targetRoles || p.targetRoles.length === 0) && uId !== 'demo_user') {
        p = await fetchProfile('demo_user');
      }
      if (!p || !p.targetRoles || p.targetRoles.length === 0) {
        router.push('/onboarding');
        return;
      }
      startTransition(() => setProfile(p));
      const a = await fetchApplications(uId);
      startTransition(() => setApps(a));

      if (a.length === 0) { setInsight('Log some applications to see patterns emerge.'); return; }
      try {
        const res = await fetch('/api/insight', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ applications: a }) });
        const data = await res.json();
        startTransition(() => setInsight(data.insight || 'Keep applying! Add more data to uncover deeper patterns in your rejection reasons.'));
      } catch { startTransition(() => setInsight('Could not load AI insight right now.')); }
    }
    loadData();
  }, [user, isLoaded, router]);

  if (!isLoaded || !profile) return null;

  const total   = apps.length;
  const screens = apps.filter(a => ['HR Screen','Technical','Final Round'].includes(a.stage)).length;
  const finals  = apps.filter(a => a.stage === 'Final Round').length;
  const stages  = [{ name: 'Applied', count: total }, { name: 'Screening', count: screens }, { name: 'Final Round', count: finals }];

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content" style={{ position: 'relative' }}>
        {/* Floating particles in background */}
        <FloatingParticles />

        {/* Subtle ruled background pattern */}
        <div style={{
          position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden',
          backgroundImage: 'repeating-linear-gradient(var(--resume-rule) 0px, transparent 1px, transparent 32px)',
          opacity: 0.04,
        }} />

        <div className="page-container" style={{ position: 'relative', zIndex: 1 }}>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: springEase }}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}
          >
            <div>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}
              >
                <motion.div
                  animate={{ rotate: [0, -8, 8, -8, 0] }}
                  transition={{ duration: 2, delay: 0.8, ease: 'easeInOut' }}
                >
                  <LayoutDashboard size={18} color="var(--accent)" />
                </motion.div>
                <h1 style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  Welcome back, {user.firstName || 'there'}
                  {plan !== 'free' && (
                    <motion.span
                      initial={{ scale: 0, rotate: -10 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 400, delay: 0.6 }}
                      style={{ fontSize: '10px', padding: '3px 10px', borderRadius: '100px', background: 'linear-gradient(135deg, var(--accent-light), var(--accent))', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '700', boxShadow: '0 4px 12px rgba(var(--accent-rgb),0.35)' }}
                    >
                      {plan}
                    </motion.span>
                  )}
                </h1>
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}
              >
                Here is your application funnel this month.
              </motion.p>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <Link href="/log" className="btn btn-primary" style={{ borderRadius: '100px', padding: '11px 22px' }}>
                <FilePlus size={15} /> Log Application
              </Link>
            </motion.div>
          </motion.div>

          {/* Metrics */}
          <motion.div
            initial="hidden"
            animate="show"
            className="grid-3"
            style={{ marginBottom: '24px' }}
          >
            <MetricCard icon={Activity}    value={total}   label="Total Applications" />
            <MetricCard icon={Target}      value={`${total > 0 ? Math.round((screens / total) * 100) : 0}%`} label="Screening Rate" />
            <MetricCard icon={TrendingUp}  value={`${screens > 0 ? Math.round((finals / screens) * 100) : 0}%`} label="Final Stage Conversion" />
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial="hidden"
            animate="show"
            className="grid-3"
            style={{ marginBottom: '24px' }}
          >
            <QuickCard href="/prep-voice"  icon={Zap}           iconColor="var(--accent)"  iconBg="rgba(var(--accent-rgb),0.1)"  title="Voice Interview"  subtitle="Practice with AI voice coach" />
            <QuickCard href="/simulation"  icon={MessageSquare} iconColor="#8B5CF6"         iconBg="rgba(139,92,246,0.1)"         title="Live Sandbox"     subtitle="Full mock interview session" />
            <QuickCard href="/extension"   icon={ScanSearch}    iconColor="var(--text-primary)" iconBg="var(--bg-secondary)"      title="Browser Mod"      subtitle="LinkedIn Match Overlay" />
          </motion.div>

          {/* Funnel + AI Insight */}
          <div className="grid-2" style={{ alignItems: 'start' }}>

            {/* Funnel Drop-off */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3, ease: springEase }}
            >
              <TiltCard>
                <motion.div
                  whileHover={{ boxShadow: 'var(--shadow-lg)' }}
                  style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-xs)', borderRadius: '16px',
                    padding: '28px', position: 'relative', overflow: 'hidden',
                  }}
                >
                  <motion.div
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                    style={{
                      position: 'absolute', top: 0, left: '10%', right: '10%', height: '1px',
                      background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
                    }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                    <Activity size={15} color="var(--accent)" />
                    <h3 style={{ fontSize: '15px', fontWeight: '700', letterSpacing: '-0.02em' }}>Funnel Drop-off</h3>
                  </div>
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
                                transition={{ duration: 0.9, delay: 0.3 + i * 0.12, ease: springEase }}
                                className="funnel-bar"
                              />
                            </div>
                            <div className="funnel-count">{st.count}</div>
                            <div className="funnel-dropoff">{i > 0 && drop > 0 ? `\u2212${drop}` : ''}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              </TiltCard>
            </motion.div>

            {/* AI Insight */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4, ease: springEase }}
            >
              <TiltCard hoverLift={-5}>
                <motion.div
                  whileHover={{ boxShadow: 'var(--shadow-lg)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                  style={{
                    borderRadius: '16px', padding: '28px',
                    background: 'linear-gradient(135deg, rgba(var(--accent-rgb),0.08) 0%, var(--bg-secondary) 100%)',
                    border: '1px solid rgba(var(--accent-rgb),0.15)',
                    boxShadow: 'var(--shadow-xs), inset 0 1px 0 rgba(255,255,255,0.5)',
                    position: 'relative', overflow: 'hidden',
                  }}
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                    style={{
                      position: 'absolute', top: '-30px', right: '-30px',
                      width: '140px', height: '140px',
                      background: 'radial-gradient(circle, rgba(var(--accent-rgb),0.15) 0%, transparent 70%)',
                      borderRadius: '50%', filter: 'blur(20px)', pointerEvents: 'none',
                    }}
                  />
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
              </TiltCard>
            </motion.div>

          </div>
        </div>
      </main>
    </div>
  );
}
