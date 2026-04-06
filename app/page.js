'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  motion, useScroll, useMotionValue, useTransform,
  useSpring, AnimatePresence
} from 'framer-motion';
import {
  Zap, Signal, ArrowRight, ScanSearch, BarChart2,
  ShieldCheck, MessageSquare, Globe, Cpu, Layers,
  Sparkles, Command, ArrowUpRight, BrainCircuit,
  TrendingUp, Search, Star, ChevronDown, CheckCircle2, UserRound, ArrowRightCircle
} from 'lucide-react';
import { useUser, SignInButton, SignUpButton } from '@clerk/nextjs';
import ThemeToggle from '@/components/ThemeToggle';

/* ── Floating Orb ─────────────────────────────────────────────── */
const Orb = ({ style }) => (
  <motion.div
    animate={{ y: [0, -28, 0], x: [0, 15, 0], scale: [1, 1.06, 1] }}
    transition={{ duration: 8 + Math.random() * 4, repeat: Infinity, ease: 'easeInOut' }}
    style={{
      position: 'absolute', borderRadius: '50%',
      filter: 'blur(60px)', pointerEvents: 'none',
      ...style,
    }}
  />
);

/* ── Scroll Reveal Wrapper ────────────────────────────────────── */
const ScrollReveal = ({ children, style }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const y      = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [40, 0, 0, -40]);
  const scale  = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.96, 1, 1, 0.96]);

  return (
    <motion.div ref={ref} style={{ opacity, y, scale, ...style }}>
      {children}
    </motion.div>
  );
};

/* ── 3D Tilt Bento Card ───────────────────────────────────────── */
const BentoCard = ({ children, style, href, accent = 'var(--accent)' }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mx = useSpring(x, { stiffness: 200, damping: 30 });
  const my = useSpring(y, { stiffness: 200, damping: 30 });
  const rotateX = useTransform(my, [-0.5, 0.5], ['9deg', '-9deg']);
  const rotateY = useTransform(mx, [-0.5, 0.5], ['-9deg', '9deg']);
  const glowX   = useTransform(mx, [-0.5, 0.5], ['0%', '100%']);
  const glowY   = useTransform(my, [-0.5, 0.5], ['0%', '100%']);

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - r.left) / r.width  - 0.5);
    y.set((e.clientY - r.top)  / r.height - 0.5);
  };
  const onLeave = () => { x.set(0); y.set(0); };

  return (
    <motion.div
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{
        rotateX, rotateY,
        transformStyle: 'preserve-3d',
        perspective: '900px',
        ...style,
      }}
    >
      <ScrollReveal style={{ height: '100%' }}>
      <Link href={href || '#'} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
        <motion.div
          whileHover={{ scale: 1.015 }}
          transition={{ duration: 0.25 }}
          style={{
            position: 'relative', height: '100%', borderRadius: '22px',
            background: 'var(--bg-card)',
            border: '1px solid rgba(255,255,255,0.55)',
            boxShadow: `
              0 1px 0 rgba(255,255,255,0.8) inset,
              0 -1px 0 rgba(0,0,0,0.04) inset,
              0 4px 24px rgba(0,0,0,0.07),
              0 1px 4px rgba(0,0,0,0.04)
            `,
            overflow: 'hidden',
            padding: '32px',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Specular highlight that follows mouse */}
          <motion.div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 'inherit',
            background: `radial-gradient(circle at ${glowX} ${glowY}, rgba(255,255,255,0.14) 0%, transparent 60%)`,
            zIndex: 2,
          }} />
          {/* Bottom edge accent */}
          <div style={{
            position: 'absolute', bottom: 0, left: '10%', right: '10%', height: '1px',
            background: `linear-gradient(90deg, transparent, ${accent}44, transparent)`,
          }} />
          <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
            {children}
          </div>
        </motion.div>
      </Link>
      </ScrollReveal>
    </motion.div>
  );
};

/* ── FAQ Item ────────────────────────────────────────────────── */

/* ── FAQ Item ────────────────────────────────────────────────── */
const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid var(--glass-border)', overflow: 'hidden' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '24px 0', background: 'none', border: 'none', cursor: 'pointer',
          textAlign: 'left', outline: 'none'
        }}
      >
        <span style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>{question}</span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
          <ChevronDown size={18} color="var(--text-muted)" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div style={{ padding: '0 0 24px', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════ */
export default function SignlLandingPage() {
  const { isLoaded, isSignedIn } = useUser();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('Features');
  const heroRef = useRef(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 40, damping: 25 });
  const springY = useSpring(mouseY, { stiffness: 40, damping: 25 });
  const headingX = useTransform(springX, [-500, 500], [-20, 20]);
  const headingY = useTransform(springY, [-500, 500], [-12, 12]);
  const bgX      = useTransform(springX, [-500, 500], [18, -18]);
  const bgY      = useTransform(springY, [-500, 500], [12, -12]);

  useEffect(() => {
    setMounted(true);
    const move = (e) => {
      mouseX.set(e.clientX - window.innerWidth / 2);
      mouseY.set(e.clientY - window.innerHeight / 2);
    };
    const scroll = () => {
      const scrollPos = window.scrollY + 200;
      ['features', 'about'].forEach(id => {
        const el = document.getElementById(id);
        if (el && scrollPos >= el.offsetTop && scrollPos < el.offsetTop + el.offsetHeight) {
          setActiveTab(id.charAt(0).toUpperCase() + id.slice(1));
        }
      });
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('scroll', scroll);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('scroll', scroll); };
  }, [mouseX, mouseY]);

  if (!isLoaded || !mounted) return null;

  const navItems = ['Features', 'About'];

  return (
    <div className="landing-page" style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text-primary)', overflowX: 'hidden', fontFamily: "'Inter', sans-serif" }}>

      {/* ── Ambient Background Layer ── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {/* Animated grid */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `
            linear-gradient(rgba(var(--accent-rgb),0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(var(--accent-rgb),0.04) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }} />
        <motion.div style={{ position: 'absolute', inset: 0, x: bgX, y: bgY }}>
          <Orb style={{ top: '5%',  left: '8%',   width: 480, height: 480, background: 'radial-gradient(circle, rgba(var(--accent-rgb),0.18) 0%, transparent 70%)' }} />
          <Orb style={{ top: '55%', right: '6%',  width: 560, height: 560, background: 'radial-gradient(circle, rgba(var(--accent-rgb),0.12) 0%, transparent 70%)', animationDuration: '11s' }} />
          <Orb style={{ top: '30%', left: '55%',  width: 280, height: 280, background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',           animationDuration: '14s' }} />
        </motion.div>
      </div>

      {/* ── Floating Nav ── */}
      <nav style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 200, width: 'max-content' }}>
        <motion.div
          initial={{ y: -24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          style={{
            background: 'var(--glass)',
            backdropFilter: 'blur(20px) saturate(1.8)',
            WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
            border: '1px solid var(--glass-border)',
            borderRadius: '100px',
            padding: '6px 6px 6px 18px',
            display: 'flex', alignItems: 'center', gap: '20px',
            boxShadow: '0 4px 32px rgba(0,0,0,0.08), 0 0 0 1px rgba(255,255,255,0.4), inset 0 1px 0 rgba(255,255,255,0.7)',
          }}
        >
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <motion.div whileHover={{ rotate: 15, scale: 1.1 }} transition={{ type: 'spring', stiffness: 400 }}
              style={{ background: 'linear-gradient(135deg, #B8955C, #9B7D47)', padding: '4px', borderRadius: '8px', display: 'flex', boxShadow: '0 2px 8px rgba(155,125,71,0.4)' }}>
              <Signal size={14} color="#fff" strokeWidth={2.5} />
            </motion.div>
            <span style={{ fontWeight: '800', fontSize: '15px', letterSpacing: '-0.02em', background: 'linear-gradient(135deg, var(--text-primary) 40%, #9B7D47 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Signl</span>
          </Link>

          <div style={{ display: 'flex', gap: '2px', position: 'relative' }}>
            {navItems.map((item) => (
              <Link key={item} href={`#${item.toLowerCase()}`} style={{ position: 'relative', padding: '7px 14px', fontSize: '13px', fontWeight: '500', color: activeTab === item ? 'var(--text-primary)' : 'var(--text-secondary)', transition: 'color 0.3s', textDecoration: 'none' }}>
                {item}
                <AnimatePresence>
                  {activeTab === item && (
                    <motion.div layoutId="nav-active" style={{ position: 'absolute', inset: 0, background: 'rgba(var(--accent-rgb),0.08)', borderRadius: '100px', zIndex: -1 }} transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }} />
                  )}
                </AnimatePresence>
              </Link>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <ThemeToggle />
            {isSignedIn ? (
              <Link href="/dashboard" style={{ background: 'linear-gradient(135deg, var(--accent-light), var(--accent))', color: '#fff', fontSize: '13px', fontWeight: '600', padding: '8px 16px', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(var(--accent-rgb),0.35)', transition: 'all 0.2s' }}>
                Dashboard <ArrowRight size={13} />
              </Link>
            ) : (
              <>
                <SignInButton mode="modal">
                  <button style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '500', padding: '0 8px', cursor: 'pointer' }}>Login</button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button style={{ background: 'linear-gradient(135deg, var(--accent-light), var(--accent))', color: '#fff', fontSize: '13px', fontWeight: '600', padding: '8px 16px', borderRadius: '100px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(var(--accent-rgb),0.35)', transition: 'all 0.2s' }}>
                    Get Started
                  </button>
                </SignUpButton>
              </>
            )}
          </div>
        </motion.div>
      </nav>

      {/* ── Hero ── */}
      <section ref={heroRef} style={{ paddingTop: '200px', paddingBottom: '120px', textAlign: 'center', paddingLeft: '24px', paddingRight: '24px', position: 'relative', zIndex: 1 }}>
        <motion.div style={{ x: headingX, y: headingY }}>
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{ marginBottom: '20px', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '100px', background: 'rgba(var(--accent-rgb),0.08)', border: '1px solid rgba(var(--accent-rgb),0.18)', boxShadow: '0 0 24px rgba(var(--accent-rgb),0.12)' }}
          >
            <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 8px rgba(var(--accent-rgb),0.8)' }} />
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Turn rejections into data</span>
          </motion.div>

          <ScrollReveal>
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              style={{ fontSize: 'clamp(46px, 7.5vw, 88px)', fontWeight: '900', lineHeight: '0.92', letterSpacing: '-0.05em', marginBottom: '32px' }}
            >
              Automate Your<br />
              <span style={{
                display: 'inline-block',
                background: 'linear-gradient(135deg, var(--text-muted) 0%, var(--accent) 60%, var(--accent-light) 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                filter: 'drop-shadow(0 0 40px rgba(var(--accent-rgb),0.3))',
              }}>
                Professional&nbsp;Evolution.
              </span>
            </motion.h1>
          </ScrollReveal>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            style={{ fontSize: '18px', color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 48px', lineHeight: '1.55' }}
          >
            The precision-engineered companion for high-growth individuals navigating the new economy.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}
          >
            {isSignedIn ? (
              <Link href="/analyse" style={{ background: 'linear-gradient(135deg, var(--accent-light) 0%, var(--accent) 100%)', color: '#fff', fontWeight: '700', padding: '16px 34px', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', boxShadow: '0 8px 28px rgba(var(--accent-rgb),0.4), inset 0 1px 0 rgba(255,255,255,0.25)', transition: 'all 0.3s', textDecoration: 'none' }}>
                Analyze Resume <Sparkles size={16} />
              </Link>
            ) : (
              <SignUpButton mode="modal">
                <button style={{ background: 'linear-gradient(135deg, var(--accent-light) 0%, var(--accent) 100%)', color: '#fff', fontWeight: '700', padding: '16px 34px', borderRadius: '100px', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', cursor: 'pointer', boxShadow: '0 8px 28px rgba(var(--accent-rgb),0.4), inset 0 1px 0 rgba(255,255,255,0.25)', transition: 'all 0.3s' }}>
                  Analyze Resume <Sparkles size={16} />
                </button>
              </SignUpButton>
            )}
            <Link href="/benchmarks" style={{ background: 'var(--glass)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontWeight: '600', padding: '16px 34px', borderRadius: '100px', fontSize: '15px', boxShadow: '0 4px 16px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.6)', transition: 'all 0.3s', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
              View Benchmarks
            </Link>
          </motion.div>
        </motion.div>


      </section>

      {/* ── Bento Feature Grid ── */}

      {/* ── Bento Feature Grid ── */}
      <section id="features" style={{ maxWidth: '1120px', margin: '0 auto', padding: '0 24px 140px', position: 'relative', zIndex: 1 }}>
        <ScrollReveal style={{ textAlign: 'center', marginBottom: '56px' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)' }}>Everything in one stack</span>
          <h2 style={{ fontSize: 'clamp(28px,4vw,40px)', fontWeight: '800', letterSpacing: '-0.03em', marginTop: '10px' }}>Your career. Accelerated.</h2>
        </ScrollReveal>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gridTemplateRows: 'repeat(2, 320px)',
          gap: '18px',
          perspective: '1800px',
        }}>
          {/* Resume Analyser — wide */}
          <BentoCard href="/analyse" style={{ gridColumn: 'span 7', gridRow: 'span 1' }} accent="var(--accent)">
            <motion.div whileHover={{ y: -2, scale: 1.04 }} style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'linear-gradient(135deg, rgba(var(--accent-rgb),0.15), rgba(var(--accent-rgb),0.05))', border: '1px solid rgba(var(--accent-rgb),0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(var(--accent-rgb),0.2)', marginBottom: '20px' }}>
              <ScanSearch size={22} color="var(--accent)" />
            </motion.div>
            <h3 style={{ fontSize: '26px', fontWeight: '800', letterSpacing: '-0.03em', marginBottom: '10px', lineHeight: '1.1' }}>Resume<br/>Analyser</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '200px', lineHeight: '1.5' }}>Precision gap analysis against high-intent job descriptions.</p>
            <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent)', fontSize: '13px', fontWeight: '600' }}>
              Try now <ArrowRight size={14} />
            </div>
            <Layers size={160} color="var(--accent)" style={{ position: 'absolute', right: '-24px', bottom: '-24px', opacity: 0.04 }} />
          </BentoCard>

          {/* Market Benchmarks */}
          <BentoCard href="/benchmarks" style={{ gridColumn: 'span 5', gridRow: 'span 1' }} accent="var(--success)">
            <motion.div whileHover={{ y: -2, scale: 1.04 }} style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(5,150,105,0.08)', border: '1px solid rgba(5,150,105,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', boxShadow: '0 4px 16px rgba(5,150,105,0.15)' }}>
              <BarChart2 size={22} color="var(--success)" />
            </motion.div>
            <h3 style={{ fontSize: '26px', fontWeight: '800', letterSpacing: '-0.03em', marginBottom: '10px', lineHeight: '1.1' }}>Market<br/>Benchmarks</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '180px', lineHeight: '1.5' }}>FAANG-level salary and seniority data insights.</p>
            <Globe size={110} color="var(--success)" style={{ position: 'absolute', right: '8px', bottom: '8px', opacity: 0.05 }} />
          </BentoCard>

          {/* Voice Interviews */}
          <BentoCard href="/prep-voice" style={{ gridColumn: 'span 5', gridRow: 'span 1' }} accent="var(--accent)">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <motion.div whileHover={{ y: -2, scale: 1.04 }} style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'linear-gradient(135deg, rgba(var(--accent-rgb),0.15), rgba(var(--accent-rgb),0.05))', border: '1px solid rgba(var(--accent-rgb),0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(var(--accent-rgb),0.2)' }}>
                <Zap size={22} color="var(--accent)" />
              </motion.div>
              <span style={{ padding: '3px 10px', borderRadius: '100px', background: 'linear-gradient(135deg, rgba(var(--accent-rgb),0.15), rgba(var(--accent-rgb),0.05))', color: 'var(--accent)', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em', border: '1px solid rgba(var(--accent-rgb),0.2)' }}>New</span>
            </div>
            <h3 style={{ fontSize: '26px', fontWeight: '800', letterSpacing: '-0.03em', marginBottom: '10px', lineHeight: '1.1' }}>Voice<br/>Interviews</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '170px', lineHeight: '1.5' }}>Speak naturally with AI. Practice tone, pace, and clarity.</p>
            <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent)', fontSize: '13px', fontWeight: '600' }}>
              Talk to AI <ArrowRight size={14} />
            </div>
          </BentoCard>

          {/* Job Matcher */}
          <BentoCard href="/jobs" style={{ gridColumn: 'span 4', gridRow: 'span 1' }} accent="#3B82F6">
            <motion.div whileHover={{ y: -2, scale: 1.04 }} style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', boxShadow: '0 4px 16px rgba(59,130,246,0.15)' }}>
              <Search size={22} color="#3B82F6" />
            </motion.div>
            <h3 style={{ fontSize: '26px', fontWeight: '800', letterSpacing: '-0.03em', marginBottom: '10px', lineHeight: '1.1' }}>Job<br/>Matcher</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '160px', lineHeight: '1.5' }}>Resume-based job discovery across live listings.</p>
            <TrendingUp size={100} color="#3B82F6" style={{ position: 'absolute', right: '8px', bottom: '8px', opacity: 0.05 }} />
          </BentoCard>

          {/* Live Sandbox */}
          <BentoCard href="/simulation" style={{ gridColumn: 'span 3', gridRow: 'span 1' }} accent="#8B5CF6">
            <motion.div whileHover={{ y: -2, scale: 1.04 }} style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', boxShadow: '0 4px 16px rgba(139,92,246,0.15)' }}>
              <MessageSquare size={22} color="#8B5CF6" />
            </motion.div>
            <h3 style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.03em', marginBottom: '10px', lineHeight: '1.1' }}>Live<br/>Sandbox</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>Full mock interviews with AI personas.</p>
            <BrainCircuit size={90} color="#8B5CF6" style={{ position: 'absolute', right: '4px', bottom: '4px', opacity: 0.05 }} />
          </BentoCard>
        </div>

        {/* ── The Signl Flow (How it works) ── */}
        <div style={{ margin: '160px auto 0' }}>
          <ScrollReveal style={{ textAlign: 'center', marginBottom: '80px' }}>
            {/* 3 Simple Steps Removed */}
            <h2 style={{ fontSize: 'clamp(28px,4vw,40px)', fontWeight: '800', letterSpacing: '-0.03em', marginTop: '10px' }}>The Signl Flow</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginTop: '14px', maxWidth: '500px', margin: '14px auto 0' }}>How we help you navigate the future.</p>
          </ScrollReveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '40px', position: 'relative' }}>
            {/* Animated Connector Line */}
            <div style={{ position: 'absolute', top: '40px', left: '15%', right: '15%', height: '1px', background: 'linear-gradient(90deg, transparent, var(--glass-border), transparent)', zIndex: 0, display: 'none' }} className="md-flex" />
            
            {[
              { icon: <ArrowUpRight />, title: 'Injest Data', body: 'Upload your global resume. We extract every professional signal and experience point automatically.' },
              { icon: <Command />, title: 'AI Synthesis', body: 'Our models analyze your profile vs market benchmarks to identify unique leverage points.' },
              { icon: <Sparkles />, title: 'Accelerate', body: 'Target matching roles, practice with AI personas, and execute your professional move.' },
            ].map((s, i) => (
              <ScrollReveal key={s.title} style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    width: '64px', height: '64px', borderRadius: '20px', background: 'var(--bg-card)', 
                    border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', 
                    justifyContent: 'center', margin: '0 auto 24px', position: 'relative',
                    boxShadow: 'var(--shadow-sm)', color: i === 1 ? 'var(--accent)' : 'var(--text-primary)'
                  }}>
                    {s.icon}
                  </div>
                  <h4 style={{ fontWeight: '700', marginBottom: '12px' }}>{s.title}</h4>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{s.body}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── About Section ── */}
      <section id="about" style={{ maxWidth: '960px', margin: '0 auto', padding: '80px 24px 160px', position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <ScrollReveal style={{ textAlign: 'center', marginBottom: '64px' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)' }}>Philosophy</span>
            <h2 style={{ fontSize: 'clamp(26px,3.5vw,38px)', fontWeight: '800', letterSpacing: '-0.03em', marginTop: '10px' }}>The Signl Approach</h2>
          </ScrollReveal>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {[
              {
                icon: <Star size={20} color="var(--accent)" />,
                title: 'Precision Over Volume',
                body: 'We believe the era of mass applications is over. Signl uses precision AI to help you identify the signals that matter, ensuring every move you make is calculated and impactful.',
              },
              {
                icon: <Sparkles size={20} color="#8B5CF6" />,
                title: 'AI as an Extension',
                body: "Signl isn't just a tool — it's a digital extension of your professional self. It handles the grind of research so you can focus on the growth of your craft.",
              },
            ].map((card) => (
              <ScrollReveal key={card.title}>
                <motion.div
                  whileHover={{ y: -4, boxShadow: 'var(--shadow-lg)' }}
                  style={{
                    padding: '32px', borderRadius: '20px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--glass-border)',
                    boxShadow: 'var(--shadow-sm), inset 0 1px 0 rgba(255,255,255,0.7)',
                    transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                    height: '100%'
                  }}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', boxShadow: 'var(--shadow-xs)' }}>
                    {card.icon}
                  </div>
                  <h4 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '10px', letterSpacing: '-0.01em' }}>{card.title}</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.65' }}>{card.body}</p>
                </motion.div>
              </ScrollReveal>
            ))}
          </div>
        </motion.div>

        {/* ── Final CTA ── */}
        <div style={{ marginTop: '160px' }}>
          <ScrollReveal>
            <div style={{
              background: 'var(--cta-bg)',
              borderRadius: '32px', padding: '100px 48px', textAlign: 'center',
              position: 'relative', overflow: 'hidden', color: 'var(--cta-text)',
              boxShadow: 'var(--cta-shadow)',
              border: 'var(--cta-border)'
            }}>
              {/* Patterns */}
              <div style={{ 
                position: 'absolute', inset: 0, opacity: 'var(--cta-dot-opacity)', 
                backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', 
                backgroundSize: '24px 24px' 
              }} />
              
              <div style={{ position: 'relative', zIndex: 1 }}>
                <h2 style={{ fontSize: 'clamp(32px, 5vw, 60px)', fontWeight: '900', letterSpacing: '-0.04em', lineHeight: '1', marginBottom: '24px' }}>
                  Ready to evolve?
                </h2>
                <p style={{ fontSize: '18px', opacity: 0.9, maxWidth: '600px', margin: '0 auto 48px', lineHeight: '1.5' }}>
                  Join thousands of professionals using AI to navigate their next career leap with surgical precision.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  {isSignedIn ? (
                    <Link href="/dashboard" style={{ background: 'var(--cta-btn-bg)', color: 'var(--cta-btn-text)', fontWeight: '800', padding: '18px 42px', borderRadius: '100px', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', textDecoration: 'none' }}>
                      Go to Dashboard <ArrowRight size={18} />
                    </Link>
                  ) : (
                    <SignUpButton mode="modal">
                      <button style={{ background: 'var(--cta-btn-bg)', color: 'var(--cta-btn-text)', fontWeight: '800', border: 'none', padding: '18px 42px', borderRadius: '100px', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', cursor: 'pointer' }}>
                        Start Your Journey <ArrowRightCircle size={18} />
                      </button>
                    </SignUpButton>
                  )}
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* ── FAQ ── */}
        <div style={{ maxWidth: '720px', margin: '160px auto 0' }}>
          <ScrollReveal style={{ textAlign: 'center', marginBottom: '48px' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)' }}>FAQ</span>
            <h2 style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-0.02em', marginTop: '10px' }}>Common Questions</h2>
          </ScrollReveal>

          <ScrollReveal>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '24px', padding: '8px 32px', boxShadow: 'var(--shadow-sm)' }}>
              {[
                { q: "Is my resume data kept private?", a: "Absolutely. We use enterprise-grade encryption and do not share your professional data with 3rd party training sets. You have full control over your stored resume." },
                { q: "How accurate is the AI matching scoring?", a: "Our models are fine-tuned on real FAANG-level hiring manager evaluations, achieving 98% accuracy in identifying critical skill gaps and market alignment." },
                { q: "Can I use multiple resumes?", a: "We focus on a 'Centralized Resume' approach to ensure the best possible cross-tool consistency, though you can update your master resume at any time in Settings." },
                { q: "Which job platforms are searched?", a: "Signl aggregates listings from LinkedIn, Indeed, Glassdoor, Wellfound, Naukri, and several niche startup boards to find the best high-intent matches." }
              ].map(item => (
                <FAQItem key={item.q} question={item.q} answer={item.a} />
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ padding: '48px 24px', borderTop: '1px solid var(--glass-border)', textAlign: 'center', position: 'relative', zIndex: 1, background: 'rgba(var(--accent-rgb),0.02)' }}>
        <motion.div whileHover={{ rotate: 15, scale: 1.1 }} style={{ display: 'inline-flex', marginBottom: '16px', padding: '8px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(var(--accent-rgb),0.12), rgba(var(--accent-rgb),0.04))', border: '1px solid rgba(var(--accent-rgb),0.15)' }}>
          <Signal size={18} color="var(--accent)" />
        </motion.div>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: '600' }}>
          © 2026 Signl Intelligence — The Future of Work Is Here
        </p>
      </footer>
    </div>
  );
}
