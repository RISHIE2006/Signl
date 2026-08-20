'use client';

import Link from 'next/link';
import { motion, useScroll, useSpring, useTransform, useVelocity } from 'framer-motion';
import { ArrowRight, ArrowUpRight, BarChart3, Check, FileText, Menu, Signal, Sparkles, Target, X, Zap } from 'lucide-react';
import { useState } from 'react';
import { useUser, SignInButton, SignUpButton } from '@clerk/nextjs';
import ThemeToggle from '@/components/ThemeToggle';

const ease = [0.16, 1, 0.3, 1];

function Brand() {
  return <Link href="/" className="new-brand"><span className="new-brand-mark"><Signal size={17} /></span>signl<span className="new-brand-dot">.</span></Link>;
}

function Reveal({ children, className = '' }) {
  return <motion.div className={className} initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: .7, ease }}>{children}</motion.div>;
}

function ScrollMotionLayer() {
  const { scrollYProgress, scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 90, damping: 22 });
  const orbY = useTransform(smoothProgress, [0, 1], ['-10vh', '75vh']);
  const orbRotate = useTransform(velocity, [-1800, 0, 1800], ['-18deg', '0deg', '18deg']);
  const orbScale = useTransform(velocity, [-1800, 0, 1800], [1.18, 1, 1.18]);
  return <><motion.div className="scroll-progress-rail"><motion.span style={{ scaleY: smoothProgress }} /></motion.div><motion.div className="scroll-orb scroll-orb-one" style={{ y: orbY, rotate: orbRotate, scale: orbScale }} /><motion.div className="scroll-orb scroll-orb-two" style={{ y: useTransform(smoothProgress, [0, 1], ['60vh', '-5vh']) }} /><motion.div className="scroll-direction-hint" style={{ opacity: useTransform(velocity, [-800, 0, 800], [.8, .2, .8]) }}><span>scroll to explore</span><i /></motion.div></>;
}

function Feature({ icon: Icon, title, body }) {
  return <motion.article whileHover={{ y: -8 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }} className="new-feature"><div className="new-feature-top"><Icon size={20} /></div><h3>{title}</h3><p>{body}</p><ArrowUpRight className="new-feature-arrow" size={17} /></motion.article>;
}

function Step({ number, title, body }) {
  return <Reveal className="new-step"><span className="new-step-number">{number}</span><div><h3>{title}</h3><p>{body}</p></div><ArrowRight size={18} /></Reveal>;
}

export default function HomePage() {
  const { isLoaded, isSignedIn } = useUser();
  const [menu, setMenu] = useState(false);
  if (!isLoaded) return null;
  return <main className="new-landing"><ScrollMotionLayer />
    <nav className="new-nav"><Brand /><div className={menu ? 'new-nav-links is-open' : 'new-nav-links'}><a href="#about">What we do</a><a href="#method">How it works</a><a href="#plans">Plans</a><a href="#explore">Explore</a></div><div className="new-nav-actions"><ThemeToggle />{isSignedIn ? <Link href="/dashboard" className="new-button new-button-dark">Open dashboard <ArrowUpRight size={15} /></Link> : <><SignInButton mode="modal"><button className="new-text-button">Sign in</button></SignInButton><SignUpButton mode="modal"><button className="new-button new-button-dark">Get started <ArrowUpRight size={15} /></button></SignUpButton></>}<button className="new-mobile-menu" onClick={() => setMenu(!menu)} aria-label="Menu">{menu ? <X /> : <Menu />}</button></div></nav>

    <section className="new-hero" id="signal"><div className="new-hero-copy"><motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6, ease }} className="new-eyebrow"><span /> intelligence for the in-between</motion.div><motion.h1 initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .75, delay: .08, ease }}>Make your next<br /><i>move</i> make sense.</motion.h1><motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .65, delay: .16, ease }}>Signl turns every application, interview, and rejection into a clearer read on where you stand—and what to do next.</motion.p><div className="new-hero-actions">{isSignedIn ? <Link href="/dashboard" className="new-button new-button-accent">See your signal <ArrowUpRight size={16} /></Link> : <SignUpButton mode="modal"><button className="new-button new-button-accent">Find your signal <ArrowUpRight size={16} /></button></SignUpButton>}<span className="new-no-card"><Check size={14} /> Free to start</span></div></div><motion.div className="product-preview" initial={{ opacity: 0, y: 34, rotate: 2 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ duration: .9, delay: .2, ease }}><div className="preview-topbar">● ● ● <span>signl / intelligence</span><b>● live</b></div><div className="preview-content"><small>MONDAY, 17 AUGUST</small><h3>Your career, in signal.</h3><div className="preview-stat-row"><div><small>APPLICATIONS</small><strong>24</strong><em>+18% this month</em></div><div><small>PROFILE SIGNAL</small><strong>87</strong><em>top 12% of peers</em></div><div><small>ACTIVE THREADS</small><strong>06</strong><em>2 need attention</em></div></div><div className="preview-chart"><div className="preview-card-label">Application momentum</div><div className="preview-sparkline" /></div></div></motion.div></section>

    <div className="new-trust-bar" id="trust"><span>Built for the serious search</span><span>Resume intelligence</span><span>Market context</span><span>Interview readiness</span></div>

    <section className="new-section new-about" id="about"><Reveal className="new-section-intro"><span className="new-section-number">01 — WHAT WE DO</span><h2>A clearer signal in a noisy career market.</h2><p>Signl is an AI career intelligence platform for people who want more than another job board. We connect the dots between your resume, your applications, your interviews, and the market around you.</p><Link href="/analyse" className="new-inline-link">Explore resume intelligence <ArrowUpRight size={15} /></Link></Reveal><div className="new-feature-grid"><Feature icon={FileText} title="Read between the lines" body="See how your resume lands against the roles you want." /><Feature icon={BarChart3} title="Know your position" body="Put every opportunity in context with market benchmarks." /><Feature icon={Target} title="Move with intent" body="Turn patterns into a focused next step." /></div></section>

    <section className="new-method-section" id="method"><Reveal className="new-section-intro"><span className="new-section-number">02 — HOW IT WORKS</span><h2>Your career has a pattern. We help you see it.</h2><p>Every interaction makes the next recommendation sharper. Signl learns from your signal, not from generic career advice.</p></Reveal><div className="new-steps"><Step number="01" title="Bring your story" body="Upload your resume, target roles, and the opportunities already in motion." /><Step number="02" title="Find the gaps" body="Get precise feedback on positioning, keywords, confidence, and fit." /><Step number="03" title="Build your edge" body="Practice, prepare, and prioritize the next move with market context." /></div><div className="new-loop"><div className="new-loop-orb"><Signal size={25} /></div><span className="new-loop-line line-one" /><span className="new-loop-line line-two" /><span className="new-loop-label">your data → better context → better decisions</span></div></section>

    <section className="new-plans-section" id="plans"><Reveal className="new-section-intro"><span className="new-section-number">03 — PLANS</span><h2>Start with clarity.<br /><i>Go deeper when ready.</i></h2><p>Simple plans for a focused search, whether you are exploring your next move or actively closing it.</p></Reveal><div className="new-plans"><Plan name="Free" price="$0" body="A calm first step." items={['Resume signal snapshot', 'Basic application tracking', 'Market benchmarks']} /><Plan featured name="Pro" price="$19" body="Your complete career cockpit." items={['Unlimited resume analysis', 'AI interview practice', 'Advanced market intelligence', 'Personalized action plans']} /><Plan name="Team" price="$49" body="For ambitious teams." items={['Everything in Pro', 'Shared hiring intelligence', 'Priority support']} /></div></section>

    <section className="new-explore-section" id="explore"><Reveal><span className="new-section-number">04 — EXPLORE SIGNL</span><h2>Everything you need<br /><i>to move forward.</i></h2></Reveal><div className="new-explore-grid"><Explore href="/analyse" icon={FileText} title="Resume Check" text="Make your experience impossible to miss." /><Explore href="/jobs" icon={Target} title="Job Matcher" text="Find roles where your signal is strongest." /><Explore href="/prep-voice" icon={Zap} title="Voice Coach" text="Practice until confidence sounds natural." /><Explore href="/benchmarks" icon={BarChart3} title="Market Data" text="Know the room before you walk into it." /></div></section>

    <section className="new-quote"><Sparkles size={20} /><blockquote>The best career move is backed by a better read of the room.</blockquote><span>— Signl Intelligence</span></section><footer className="new-footer"><Brand /><span>Career intelligence for people in motion.</span><span>© 2026 Signl</span></footer>
  </main>;
}

function Plan({ name, price, body, items, featured }) { return <Reveal className={featured ? 'new-plan featured' : 'new-plan'}>{featured && <span className="new-plan-badge">Most popular</span>}<span className="new-plan-name">{name}</span><strong>{price}<small>{price !== '$0' && '/ month'}</small></strong><p>{body}</p><ul>{items.map(item => <li key={item}><Check size={14} /> {item}</li>)}</ul><Link href="/billing" className="new-plan-link">Explore plan <ArrowUpRight size={14} /></Link></Reveal>; }
function Explore({ href, icon: Icon, title, text }) { return <Link href={href} className="new-explore-card"><Icon size={19} /><div><h3>{title}</h3><p>{text}</p></div><ArrowUpRight size={16} /></Link>; }
