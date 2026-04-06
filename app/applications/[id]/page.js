'use client';
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter, useParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { getApplicationById, updateApplication, getAnalyses } from '@/lib/store';
import { ArrowLeft, ExternalLink, CheckCircle2, Circle, XCircle, Ghost, Mail, Linkedin, FileText, Sparkles, Copy, Check } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const STAGES = ['Resume', 'HR Screen', 'Technical', 'Final Round', 'Offer'];
const TERMINAL_NEGATIVE = ['Rejected', 'Ghosted'];

const REJECTION_TAGS = [
  'Skills gap', 'Salary mismatch', 'Ghosted', 'Cultural fit',
  'Location', 'Overqualified', 'Underqualified', 'Role filled internally', 'Other',
];

export default function ApplicationDetailPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const params = useParams();
  const appId = params?.id;

  const [app, setApp] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [notes, setNotes] = useState({}); // { stageName: noteText }
  const [notesTimer, setNotesTimer] = useState({});
  const [outreach, setOutreach] = useState({ loading: false, result: null, type: 'linkedin-networking' });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) { router.push('/sign-in'); return; }
    const found = getApplicationById(user.id, appId);
    if (!found) { router.push('/applications'); return; }
    setApp(found);
    setNotes(found.stageNotes || {});

    // Try to find a matching analysis
    const allAnalyses = getAnalyses(user.id);
    const match = allAnalyses.find(a => 
      a.company?.toLowerCase() === found.company.toLowerCase() || 
      a.role?.toLowerCase() === found.role.toLowerCase()
    ) || allAnalyses[0]; // Fallback to latest analysis
    setAnalysis(match);
  }, [user, isLoaded, appId, router]);

  const setStage = (stage) => {
    if (!user || !app) return;
    updateApplication(user.id, app.id, { stage });
    setApp(prev => ({ ...prev, stage }));
  };

  const toggleRejectionTag = (tag) => {
    if (!user || !app) return;
    const current = app.rejectionTags || [];
    const updated = current.includes(tag) ? current.filter(t => t !== tag) : [...current, tag];
    updateApplication(user.id, app.id, { rejectionTags: updated });
    setApp(prev => ({ ...prev, rejectionTags: updated }));
  };

  const handleNoteChange = (stage, value) => {
    setNotes(prev => ({ ...prev, [stage]: value }));
    // debounce autosave
    clearTimeout(notesTimer[stage]);
    const t = setTimeout(() => {
      const merged = { ...notes, [stage]: value };
      updateApplication(user.id, app.id, { stageNotes: merged });
    }, 700);
    setNotesTimer(prev => ({ ...prev, [stage]: t }));
  };

  const generateOutreach = async (type) => {
    if (!analysis || !app) return;
    setOutreach(prev => ({ ...prev, loading: true, type }));
    try {
      const res = await fetch('/api/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          resume: analysis.resumeText, 
          jd: app.jdText || analysis.jdText || app.role, 
          type 
        }),
      });
      const data = await res.json();
      setOutreach(prev => ({ ...prev, result: data, loading: false }));
    } catch (err) {
      console.error(err);
      setOutreach(prev => ({ ...prev, loading: false }));
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isLoaded || !app) return null;

  const currentStageIdx = STAGES.indexOf(app.stage);
  const isNegative = TERMINAL_NEGATIVE.includes(app.stage);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-container">
          {/* Back + Header */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <Link href="/applications" className="btn btn-ghost btn-sm" style={{ marginBottom: '20px', display: 'inline-flex' }}>
              <ArrowLeft size={14} /> Back to Applications
            </Link>

            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1 className="page-title">{app.company}</h1>
                <p className="page-subtitle">{app.role} · Applied {app.date ? new Date(app.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</p>
              </div>
              {app.link && (
                <a href={app.link} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
                  <ExternalLink size={13} /> Job Posting
                </a>
              )}
            </div>
          </motion.div>

          {/* Stage Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="card"
            style={{ marginBottom: '24px' }}
          >
            <h3 style={{ fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '28px' }}>
              Application Timeline
            </h3>

            {/* Stepper */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, overflowX: 'auto', paddingBottom: '8px' }}>
              {STAGES.map((stage, idx) => {
                const isPassed = currentStageIdx > idx;
                const isCurrent = currentStageIdx === idx && !isNegative;
                return (
                  <div key={stage} style={{ display: 'flex', alignItems: 'flex-start', flex: 1, minWidth: '90px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                      <button
                        onClick={() => setStage(stage)}
                        title={`Set stage to ${stage}`}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                          color: isCurrent ? 'var(--accent)' : isPassed ? 'var(--success)' : 'var(--text-muted)',
                          transition: 'transform 0.15s, color 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        {isPassed ? <CheckCircle2 size={26} /> : isCurrent ? <CheckCircle2 size={26} /> : <Circle size={26} />}
                      </button>
                      <div style={{
                        fontSize: '11px', fontWeight: isCurrent || isPassed ? '600' : '400',
                        color: isCurrent ? 'var(--accent)' : isPassed ? 'var(--success)' : 'var(--text-muted)',
                        textAlign: 'center', marginTop: '6px', lineHeight: '1.3',
                      }}>
                        {stage}
                      </div>
                    </div>
                    {idx < STAGES.length - 1 && (
                      <div style={{
                        height: '2px', flex: 1, marginTop: '17px',
                        background: isPassed ? 'var(--success)' : 'var(--border-color, #e5e7eb)',
                        transition: 'background 0.3s',
                        minWidth: '20px',
                      }} />
                    )}
                  </div>
                );
              })}

              {/* Terminal: Rejected / Ghosted */}
              <div style={{ display: 'flex', alignItems: 'flex-start', minWidth: '110px' }}>
                <div style={{ height: '2px', flex: 1, marginTop: '17px', background: isNegative ? 'var(--danger)' : 'var(--border-color, #e5e7eb)', minWidth: '20px' }} />
                <div style={{ display: 'flex', gap: '8px' }}>
                  {TERMINAL_NEGATIVE.map(neg => {
                    const isActive = app.stage === neg;
                    return (
                      <div key={neg} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <button
                          onClick={() => setStage(neg)}
                          title={`Mark as ${neg}`}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                            color: isActive ? 'var(--danger)' : 'var(--text-muted)',
                            transition: 'transform 0.15s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
                          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                          {neg === 'Rejected' ? <XCircle size={26} /> : <Ghost size={26} />}
                        </button>
                        <div style={{
                          fontSize: '11px', fontWeight: isActive ? '600' : '400',
                          color: isActive ? 'var(--danger)' : 'var(--text-muted)',
                          textAlign: 'center', marginTop: '6px',
                        }}>
                          {neg}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Rejection tags (shown when Rejected or Ghosted) */}
            {isNegative && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
                style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--border-color, #e5e7eb)' }}
              >
                <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
                  Rejection Reason
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {REJECTION_TAGS.map(tag => {
                    const active = (app.rejectionTags || []).includes(tag);
                    return (
                      <button
                        key={tag}
                        className={`chip ${active ? 'active' : ''}`}
                        onClick={() => toggleRejectionTag(tag)}
                        style={{ fontSize: '12px', borderColor: active ? 'var(--danger)' : undefined, color: active ? 'var(--danger)' : undefined }}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Interview Notes per Stage */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="card"
            style={{ marginBottom: '24px' }}
          >
            <h3 style={{ fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Stage Notes
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {STAGES.filter((_, i) => i <= Math.max(currentStageIdx, 0)).map(stage => (
                <div key={stage}>
                  <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>{stage}</label>
                  <textarea
                    className="textarea"
                    value={notes[stage] || ''}
                    onChange={e => handleNoteChange(stage, e.target.value)}
                    placeholder={`Notes for ${stage} stage...`}
                    style={{ minHeight: '90px', fontSize: '13px', resize: 'vertical' }}
                  />
                </div>
              ))}
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '12px' }}>Notes auto-save as you type.</p>
          </motion.div>
          
          {/* AI Networking Autopilot */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="card"
            style={{ marginBottom: '24px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', margin: 0 }}>
                AI Networking Autopilot
              </h3>
              <Sparkles size={14} color="var(--accent)" />
            </div>

            {!analysis ? (
              <div style={{ padding: '20px', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px dashed var(--border)' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>No resume analysis found for this role. Run the <Link href="/analyse" style={{ color: 'var(--accent)', fontWeight: 500 }}>Resume Analyser</Link> to enable outreach generation.</p>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                  <button 
                    className={`btn btn-sm ${outreach.type === 'linkedin-networking' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => generateOutreach('linkedin-networking')}
                    disabled={outreach.loading}
                  >
                    <Linkedin size={14} /> LinkedIn Request
                  </button>
                  <button 
                    className={`btn btn-sm ${outreach.type === 'cold-email' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => generateOutreach('cold-email')}
                    disabled={outreach.loading}
                  >
                    <Mail size={14} /> Cold Email
                  </button>
                  <button 
                    className={`btn btn-sm ${outreach.type === 'cover-letter' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => generateOutreach('cover-letter')}
                    disabled={outreach.loading}
                  >
                    <FileText size={14} /> Cover Letter
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {outreach.loading ? (
                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ padding: '40px', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                      <div className="loading-spinner" style={{ marginBottom: '12px' }} />
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Generating personalized outreach...</p>
                    </motion.div>
                  ) : outreach.result ? (
                    <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ position: 'relative' }}>
                      <div style={{ padding: '20px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-soft)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                          <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{outreach.result.title}</div>
                          <button 
                            onClick={() => copyToClipboard(outreach.result.content)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? 'var(--success)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}
                          >
                            {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
                          </button>
                        </div>
                        <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.6', whiteSpace: 'pre-wrap', margin: 0 }}>{outreach.result.content}</p>
                      </div>
                    </motion.div>
                  ) : (
                    <div style={{ padding: '40px', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px dashed var(--border)' }}>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Select a type above to generate your outreach message.</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>

          {/* General Notes */}
          {app.notes && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="insight-card"
            >
              <div className="insight-label" style={{ marginBottom: '8px' }}>Original Notes</div>
              <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{app.notes}</p>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
