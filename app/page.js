'use client';
import React from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { Signal, MapPin, Briefcase, Globe, Mail, Sparkles, ArrowUpRight } from 'lucide-react';
import { useUser, SignInButton, SignUpButton } from '@clerk/nextjs';
import ThemeToggle from '@/components/ThemeToggle';

const spring = [0.16, 1, 0.3, 1];

function SectionLine() {
  return (
    <div style={{
      height: '1px', background: 'var(--resume-rule)',
      margin: '20px 0',
    }} />
  );
}

function SectionTitle({ children }) {
  return (
    <h2 style={{
      fontFamily: 'var(--resume-font-sans)', fontWeight: '700',
      fontSize: '10px', color: 'var(--resume-text-muted)',
      textTransform: 'uppercase', letterSpacing: '0.12em',
      marginBottom: '10px',
    }}>
      {children}
    </h2>
  );
}

function ExpEntry({ period, title, company, bullets }) {
  return (
    <div style={{ marginBottom: '18px' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        marginBottom: '2px',
      }}>
        <h3 style={{
          fontFamily: 'var(--resume-font-sans)', fontWeight: '600',
          fontSize: '13px', color: 'var(--resume-text)',
        }}>
          {title}
        </h3>
        <span style={{
          fontSize: '11px', color: 'var(--resume-text-muted)',
          fontFamily: 'var(--resume-font-sans)',
          whiteSpace: 'nowrap', marginLeft: '12px',
        }}>
          {period}
        </span>
      </div>
      <div style={{
        fontSize: '11px', color: 'var(--resume-accent)',
        fontWeight: '600', marginBottom: '6px',
      }}>
        {company}
      </div>
      <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
        {bullets.map((b, i) => (
          <li key={i} style={{
            fontSize: '11px', color: 'var(--resume-text-secondary)',
            lineHeight: '1.7', paddingLeft: '12px',
            position: 'relative',
          }}>
            <span style={{
              position: 'absolute', left: 0, top: '7px',
              width: '3px', height: '3px', borderRadius: '50%',
              background: 'var(--resume-text-muted)',
            }} />
            {b}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SkillTag({ children }) {
  return (
    <span style={{
      fontSize: '10px', padding: '2px 8px', borderRadius: '2px',
      background: 'var(--resume-rule)', color: 'var(--resume-text-secondary)',
      display: 'inline-block',
    }}>
      {children}
    </span>
  );
}

export default function SignlLanding() {
  const { isLoaded, isSignedIn } = useUser();

  const { scrollYProgress } = useScroll();

  const rotateX = useTransform(scrollYProgress, [0, 1], ['4deg', '-4deg']);
  const rotateY = useTransform(scrollYProgress, [0, 1], ['-5deg', '5deg']);
  const cardY = useTransform(scrollYProgress, [0, 1], ['-15px', '15px']);
  const scale = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [1, 0.98, 0.98, 1]);
  const smoothRotateX = useSpring(rotateX, { stiffness: 30, damping: 18 });
  const smoothRotateY = useSpring(rotateY, { stiffness: 30, damping: 18 });
  const smoothY = useSpring(cardY, { stiffness: 30, damping: 18 });
  const smoothScale = useSpring(scale, { stiffness: 80, damping: 20 });

  if (!isLoaded) return null;

  return (
    <div className="landing-resume" style={{
      minHeight: '100vh',
      background: 'var(--resume-bg)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '40px 16px 60px',
      perspective: '1200px',
      overflowX: 'hidden',
    }}>
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: spring }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
          padding: '10px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--glass)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '7px', textDecoration: 'none' }}>
          <div style={{
            width: '26px', height: '26px', borderRadius: '6px',
            background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Signal size={12} color="#fff" strokeWidth={2.5} />
          </div>
          <span style={{ fontWeight: '700', fontSize: '14px' }}>Signl</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ThemeToggle />
          {isSignedIn ? (
            <Link href="/dashboard" className="btn btn-primary btn-sm">Dashboard</Link>
          ) : (
            <>
              <SignInButton mode="modal">
                <button className="btn btn-ghost btn-sm" style={{ fontSize: '11px', padding: '5px 12px' }}>Sign In</button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="btn btn-primary btn-sm" style={{ fontSize: '11px', padding: '5px 12px' }}>Get Started</button>
              </SignUpButton>
            </>
          )}
        </div>
      </motion.header>

      {/* Resume Card */}
      <motion.div
        style={{
          rotateX: smoothRotateX,
          rotateY: smoothRotateY,
          y: smoothY,
          scale: smoothScale,
          transformStyle: 'preserve-3d',
          width: '100%', maxWidth: '720px',
          background: 'var(--resume-card)',
          borderRadius: '4px',
          padding: '48px 44px',
          marginTop: '70px',
          position: 'relative',
          zIndex: 2,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06), 0 12px 48px rgba(0,0,0,0.08)',
        }}
      >
        {/* Paper texture */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10,
          borderRadius: 'inherit', opacity: 0.02,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat', backgroundSize: '256px 256px',
          mixBlendMode: 'multiply',
        }} />

        {/* Hairline border */}
        <div style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', border: '1px solid var(--resume-rule)', pointerEvents: 'none' }} />

        {/* Name + Title */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{
            fontFamily: 'var(--resume-font-sans)', fontWeight: '800',
            fontSize: 'clamp(26px, 3vw, 34px)',
            letterSpacing: '-0.02em', color: 'var(--resume-text)',
            marginBottom: '2px',
          }}>
            Signl
          </h1>
          <div style={{
            fontSize: '13px', color: 'var(--resume-accent)',
            fontWeight: '600', marginBottom: '8px',
            fontFamily: 'var(--resume-font-sans)',
          }}>
            AI Career Intelligence Platform
          </div>
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '14px',
            fontSize: '10px', color: 'var(--resume-text-muted)',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={10} /> San Francisco, CA
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Briefcase size={10} /> Professional Tools
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Globe size={10} /> signl.ai
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Mail size={10} /> hello@signl.ai
            </span>
          </div>
        </div>

        <SectionLine />

        {/* Professional Summary */}
        <div style={{ marginBottom: '20px' }}>
          <SectionTitle>Professional Summary</SectionTitle>
          <p style={{
            fontSize: '11px', color: 'var(--resume-text-secondary)',
            lineHeight: '1.8',
          }}>
            AI-powered career platform that analyzes resumes against market benchmarks, delivers
            precision gap analysis, facilitates voice interview practice with real-time feedback,
            and surfaces targeted opportunities. Purpose-built for professionals navigating
            competitive career transitions.
          </p>
        </div>

        <SectionLine />

        {/* Experience */}
        <div style={{ marginBottom: '20px' }}>
          <SectionTitle>Experience</SectionTitle>

          <ExpEntry
            period="2026 \u2014 Present"
            title="Resume Analyser"
            company="Signl Intelligence"
            bullets={[
              "Upload resume and receive precision gap analysis against target job descriptions",
              "AI identifies missing keywords, skills, and experience patterns for ATS optimisation",
              "Actionable recommendations for resume restructuring and keyword targeting",
            ]}
          />

          <ExpEntry
            period="2026 \u2014 Present"
            title="Market Benchmarks"
            company="Signl Intelligence"
            bullets={[
              "FAANG-level salary data, seniority mapping, and real market positioning analysis",
              "Profile comparison against industry peers with matching experience and skillsets",
              "Data-driven intelligence for compensation negotiation and career planning",
            ]}
          />

          <ExpEntry
            period="2026 \u2014 Present"
            title="Voice Interview Practice"
            company="Signl Intelligence"
            bullets={[
              "Natural speech interaction with AI interviewers — real-time tone, pace, and clarity metrics",
              "Behavioural, technical, and case interview formats with adaptive AI personas",
              "Progress tracking across pace, filler word frequency, and confidence scoring",
            ]}
          />
        </div>

        <SectionLine />

        {/* Skills */}
        <div style={{ marginBottom: '20px' }}>
          <SectionTitle>Core Competencies</SectionTitle>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {[
              'Resume Parsing', 'Gap Analysis', 'Market Benchmarking',
              'Salary Intelligence', 'Real-time Voice AI', 'Tone Analysis',
              'Behavioural Interviewing', 'Technical Interviewing', 'Job Matching',
              'Application Pipeline', 'Cover Letter Generation', 'Career Planning',
            ].map(s => <SkillTag key={s}>{s}</SkillTag>)}
          </div>
        </div>

        <SectionLine />

        {/* Education */}
        <div style={{ marginBottom: '4px' }}>
          <SectionTitle>Education</SectionTitle>
          <div>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            }}>
              <h3 style={{
                fontFamily: 'var(--resume-font-sans)', fontWeight: '600',
                fontSize: '13px', color: 'var(--resume-text)',
              }}>
                AI Engineering
              </h3>
              <span style={{
                fontSize: '11px', color: 'var(--resume-text-muted)',
                whiteSpace: 'nowrap', marginLeft: '12px',
              }}>
                2026
              </span>
            </div>
            <div style={{
              fontSize: '11px', color: 'var(--resume-accent)',
              fontWeight: '500',
            }}>
              Signl Intelligence Labs
            </div>
          </div>
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: spring }}
        style={{ marginTop: '40px', textAlign: 'center', zIndex: 2 }}
      >
        <p style={{
          fontSize: '12px', color: 'var(--resume-text-secondary)',
          marginBottom: '14px',
        }}>
          Ready to optimise your career trajectory?
        </p>
        {isSignedIn ? (
          <Link href="/analyse" style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            fontSize: '12px', fontWeight: '600',
            padding: '10px 22px', borderRadius: '4px',
            background: 'var(--resume-accent)', color: '#fff',
            textDecoration: 'none',
          }}>
            Analyse Your Resume <ArrowUpRight size={13} />
          </Link>
        ) : (
          <SignUpButton mode="modal">
            <button style={{
              fontSize: '12px', fontWeight: '600',
              padding: '10px 22px', borderRadius: '4px', border: 'none',
              background: 'var(--resume-accent)', color: '#fff',
              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px',
            }}>
              Get Started <Sparkles size={12} />
            </button>
          </SignUpButton>
        )}
      </motion.div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        style={{
          marginTop: '40px', padding: '16px',
          fontSize: '10px', color: 'var(--resume-text-muted)',
          textAlign: 'center', zIndex: 2,
        }}
      >
        &copy; 2026 Signl Intelligence
      </motion.footer>
    </div>
  );
}
