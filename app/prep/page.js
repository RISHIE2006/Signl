'use client';
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Sidebar from '@/components/Sidebar';
import { addPrep, getPreps, deletePrep } from '@/lib/store';
import CompanyAutocomplete from '@/components/CompanyAutocomplete';
import {
  BrainCircuit, Sparkles, AlertTriangle, Lightbulb,
  ChevronDown, ChevronUp, Star, Clock, Building2, Briefcase, AlertCircle, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TYPE_COLORS = {
  Behavioural: 'badge-blue',
  Technical: 'badge-purple',
  Culture: 'badge-amber',
  Situational: 'badge-slate',
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

function QuestionCard({ q, idx, company, role }) {
  const [open, setOpen] = useState(false);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);

  const getFeedback = async () => {
    if (!answer.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q.question, answer, company, role }),
      });
      const data = await res.json();
      setFeedback(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div variants={item} className="card" style={{ padding: '16px 20px', marginBottom: '10px' }}>
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: 'pointer', gap: '12px' }}
        onClick={() => setOpen(o => !o)}
      >
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flex: 1 }}>
          <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)', minWidth: '22px', paddingTop: '1px' }}>
            {String(idx + 1).padStart(2, '0')}
          </span>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '14px', fontWeight: '500', lineHeight: '1.5', margin: 0 }}>{q.question}</p>
            <span className={`badge ${TYPE_COLORS[q.type] || 'badge-slate'}`} style={{ fontSize: '10px', marginTop: '6px', display: 'inline-block' }}>
              {q.type}
            </span>
          </div>
        </div>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px', flexShrink: 0 }}>
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ paddingTop: '14px', borderTop: '1px solid var(--border-color,#e5e7eb)', marginTop: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '12px', padding: '10px 14px', background: 'var(--accent-pale)', borderRadius: '8px', border: '1px solid var(--accent-border, rgba(99,102,241,0.2))' }}>
                <Lightbulb size={14} color="var(--accent)" style={{ flexShrink: 0, marginTop: '1px' }} />
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>{q.hint}</p>
              </div>
              
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Practice your answer</label>
              <textarea
                className="textarea"
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                placeholder="Type your response here to get AI feedback..."
                style={{ minHeight: '100px', fontSize: '13px', marginBottom: '12px' }}
              />
              
              <button 
                className="btn btn-primary btn-sm" 
                onClick={getFeedback} 
                disabled={loading || !answer.trim()}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {loading ? 'Evaluating...' : <><Sparkles size={13} /> Get AI Feedback</>}
              </button>

              {feedback && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: '20px', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Feedback Score</span>
                    <span style={{ fontSize: '18px', fontWeight: '800', color: feedback.score >= 7 ? 'var(--success)' : 'var(--accent)' }}>{feedback.score}/10</span>
                  </div>
                  
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--success)', marginBottom: '4px' }}>STRENGTHS</div>
                    <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {feedback.strengths?.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent)', marginBottom: '4px' }}>IMPROVEMENTS</div>
                    <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {feedback.improvements?.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>

                  <div style={{ padding: '12px', background: 'var(--bg)', borderRadius: '6px', border: '1px solid var(--border-soft)' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '6px' }}>IDEAL SAMPLE ANSWER</div>
                    <p style={{ fontSize: '13px', color: 'var(--text-primary)', margin: 0, lineHeight: '1.5', fontStyle: 'italic' }}>"{feedback.sampleAnswer}"</p>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function PrepPage() {
  const { user } = useUser();
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [jd, setJd] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pastSessions, setPastSessions] = useState([]);
  const [showPast, setShowPast] = useState(false);

  useEffect(() => {
    if (user) setPastSessions(getPreps(user.id));
  }, [user]);

  const generate = async () => {
    if (!company.trim() || !role.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company, role, jd }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setResult(data);
      if (user) {
        const saved = addPrep(user.id, { company, role, ...data });
        setPastSessions(prev => [saved, ...prev]);
      }
    } catch (err) {
      setError('Failed to generate prep. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadSession = (session) => {
    setCompany(session.company);
    setRole(session.role);
    setResult({ questions: session.questions, starPrompts: session.starPrompts, tips: session.tips, redFlags: session.redFlags });
    setShowPast(false);
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-container">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 className="page-title">Interview Prep Coach</h1>
              <p className="page-subtitle">AI-generated prep packs tailored to your role and company.</p>
            </div>
            {pastSessions.length > 0 && (
              <button className="btn btn-ghost btn-sm" onClick={() => setShowPast(o => !o)}>
                <Clock size={13} /> Past Sessions ({pastSessions.length})
              </button>
            )}
          </motion.div>

          {/* Past sessions panel */}
          <AnimatePresence>
            {showPast && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="card"
                style={{ marginBottom: '20px', overflow: 'hidden' }}
              >
                <div style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '12px' }}>Past Prep Sessions</div>
                {pastSessions.map(s => (
                  <div
                    key={s.id}
                    style={{
                      display: 'flex', alignItems: 'center', width: '100%', padding: '6px 8px',
                      borderRadius: '8px', transition: 'background 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <button
                      onClick={() => loadSession(s)}
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        flex: 1, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                        padding: '6px'
                      }}
                    >
                      <span style={{ fontWeight: '500', fontSize: '14px' }}>{s.company} — {s.role}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(s.createdAt).toLocaleDateString()}</span>
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '6px', marginLeft: '4px', color: 'var(--text-muted)' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePrep(user.id, s.id);
                        setPastSessions(prev => prev.filter(p => p.id !== s.id));
                      }}
                      title="Delete Session"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input Form */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="card" style={{ marginBottom: '28px' }}>
            <div className="grid-2" style={{ marginBottom: '16px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Building2 size={13} /> Company Name
                </label>
                <CompanyAutocomplete value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Google, Stripe, McKinsey" />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Briefcase size={13} /> Job Role
                </label>
                <input className="input" value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Software Engineer, Product Manager" />
              </div>
            </div>
            <div className="form-group" style={{ margin: 0, marginBottom: '20px' }}>
              <label className="form-label">Job Description <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional — improves accuracy)</span></label>
              <textarea className="textarea" value={jd} onChange={e => setJd(e.target.value)} placeholder="Paste the job description for more targeted questions..." style={{ minHeight: '100px' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                className="btn btn-primary"
                onClick={generate}
                disabled={loading || !company.trim() || !role.trim()}
                style={{ padding: '12px 40px', opacity: (!company.trim() || !role.trim()) ? 0.4 : 1 }}
              >
                {loading ? (
                  <><div className="loading-spinner" style={{ width: '16px', height: '16px', marginRight: '8px', borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }} /> Generating prep pack...</>
                ) : (
                  <><Sparkles size={15} /> Generate Prep Pack</>
                )}
              </button>
            </div>
          </motion.div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 18px', border: '1px solid var(--danger)', borderRadius: 'var(--radius)', color: 'var(--danger)', marginBottom: '24px', background: 'var(--danger-light)' }}>
                <AlertCircle size={16} />
                <span style={{ fontSize: '14px' }}>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results */}
          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                {/* Section header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <BrainCircuit size={18} color="var(--accent)" />
                  <h2 style={{ fontSize: '16px', fontWeight: '600' }}>Prep Pack: {company} · {role}</h2>
                </div>

                {/* Interview Questions */}
                <div style={{ marginBottom: '32px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '14px' }}>
                    Interview Questions
                  </div>
                  <motion.div variants={container} initial="hidden" animate="show">
                    {(result.questions || []).map((q, i) => (
                      <QuestionCard key={i} q={q} idx={i} company={company} role={role} />
                    ))}
                  </motion.div>
                </div>

                {/* STAR Prompts + Tips/Red Flags grid */}
                <div className="grid-2" style={{ alignItems: 'start', gap: '20px' }}>
                  {/* STAR Prompts */}
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Star size={12} /> STAR Story Prompts
                    </div>
                    {(result.starPrompts || []).map((s, i) => (
                      <div key={i} className="card" style={{ marginBottom: '10px', padding: '16px 20px', borderLeft: '3px solid var(--accent)' }}>
                        <p style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', lineHeight: '1.5' }}>{s.prompt}</p>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.4' }}>💡 {s.whyItMatters}</p>
                      </div>
                    ))}
                  </motion.div>

                  <div>
                    {/* Tips */}
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} style={{ marginBottom: '20px' }}>
                      <div style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Lightbulb size={12} /> Key Tips
                      </div>
                      <div className="card" style={{ padding: '16px 20px' }}>
                        {(result.tips || []).map((t, i) => (
                          <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: i < result.tips.length - 1 ? '12px' : 0, alignItems: 'flex-start' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)', marginTop: '6px', flexShrink: 0 }} />
                            <p style={{ fontSize: '13px', lineHeight: '1.5', margin: 0, color: 'var(--text-primary)' }}>{t}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>

                    {/* Red Flags */}
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                      <div style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <AlertTriangle size={12} /> Red Flags to Avoid
                      </div>
                      <div className="card" style={{ padding: '16px 20px', borderColor: 'var(--danger-border, rgba(239,68,68,0.3))' }}>
                        {(result.redFlags || []).map((r, i) => (
                          <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: i < result.redFlags.length - 1 ? '12px' : 0, alignItems: 'flex-start' }}>
                            <AlertTriangle size={13} color="var(--danger)" style={{ flexShrink: 0, marginTop: '2px' }} />
                            <p style={{ fontSize: '13px', lineHeight: '1.5', margin: 0, color: 'var(--text-primary)' }}>{r}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
