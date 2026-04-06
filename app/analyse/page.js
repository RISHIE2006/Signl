'use client';
import { useState, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import Sidebar from '@/components/Sidebar';
import ResumeManager from '@/components/ResumeManager';
import { addAnalysis } from '@/lib/store';
import { Sparkles, AlertCircle, FileUp, FileText, X, BrainCircuit, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBilling } from '@/hooks/useBilling';
import TailoredResumePreview from '@/components/TailoredResumePreview';

export default function AnalysePage() {
  const { user } = useUser();
  const { canAddAnalysis, usage, limits } = useBilling();
  const [resumeData, setResumeData] = useState(null);
  const [jd, setJd] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [learningPathLoading, setLearningPathLoading] = useState(false);
  const [learningPath, setLearningPath] = useState(null);
  const [error, setError] = useState('');
  const [tailoredData, setTailoredData] = useState(null);
  const [view, setView] = useState('analysis'); // 'analysis' or 'tailored'
  
  const analyse = async () => {
    if (!resumeData?.text || !jd.trim()) return;
    
    setLoading(true);
    setError('');
    setResult(null);
    
    try {
      const res = await fetch('/api/analyse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume: resumeData.text, jd }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        try {
          const errorJson = JSON.parse(errorText);
          setError(errorJson.error || `Error ${res.status}: Analysis failed.`);
        } catch {
          setError(`Server error ${res.status}. Please check your connection or try again.`);
        }
        return;
      }

      const data = await res.json();
      setResult(data);
      if (data.tailoredResume) {
        setTailoredData(data.tailoredResume);
      }
      
      if (user) {
        addAnalysis(user.id, { 
          ...data, 
          resumeText: resumeData.text, 
          jdText: jd 
        });
      }
    } catch (err) {
      console.error('Frontend analysis error:', err);
      setError('A network error occurred. Please check your internet and try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateLearningPath = async () => {
    if (!result?.skillGaps?.length) return;
    setLearningPathLoading(true);
    try {
      const res = await fetch('/api/learning-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills: result.skillGaps, role: 'the target role' }),
      });
      const data = await res.json();
      setLearningPath(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLearningPathLoading(false);
    }
  };


  const scoreColor = (score) => {
    if (score >= 80) return 'var(--success)';
    if (score >= 60) return 'var(--accent)';
    return 'var(--danger)';
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-container">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="page-header">
            <h1 className="page-title">Resume Analyser</h1>
            <p className="page-subtitle">Upload your resume and the job description to find the gap.</p>
          </motion.div>

          {view === 'tailored' && tailoredData ? (
            <TailoredResumePreview 
              data={tailoredData} 
              onBack={() => setView('analysis')} 
            />
          ) : (
            <>
              {/* Input Area */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="grid-2" style={{ marginBottom: '24px', alignItems: 'start' }}>
            
            {/* Resume Input - Centralized ResumeManager */}
            <div className="form-group" style={{ margin: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label className="form-label" style={{ margin: 0 }}>Your Resume</label>
              </div>
              <ResumeManager onUpdate={setResumeData} />
            </div>

            <div className="form-group" style={{ margin: 0, height: '100%' }}>
              <label className="form-label" style={{ marginBottom: '10px' }}>Job Description</label>
              <textarea
                className="textarea"
                value={jd}
                onChange={e => setJd(e.target.value)}
                placeholder="Paste the target job description here..."
                style={{ height: 'calc(100% - 28px)', minHeight: '340px' }}
              />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '40px' }}>
            <button
              className="btn btn-primary"
              onClick={analyse}
              disabled={loading || !resumeData?.text || !jd.trim() || !canAddAnalysis}
              style={{ padding: '12px 40px', opacity: (loading || !resumeData?.text || !jd.trim() || !canAddAnalysis) ? 0.4 : 1 }}
            >
              {loading ? (
                <><div className="loading-spinner" style={{ width: '16px', height: '16px', marginRight: '8px', borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }} /> Analysing...</>
              ) : !canAddAnalysis ? (
                <><Lock size={15} /> Pro Plan Required</>
              ) : (
                <><Sparkles size={15} /> Analyse Match</>
              )}
            </button>
            {!canAddAnalysis && (
              <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                You have reached your limit of {limits.analysesLimit} free analyses. <a href="/billing" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Upgrade to Pro</a>
              </div>
            )}
          </motion.div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, height: 0 }}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 18px', border: '1px solid var(--danger)', borderRadius: 'var(--radius)', color: 'var(--danger)', marginBottom: '24px', background: 'var(--danger-light)' }}
              >
                <AlertCircle size={16} />
                <span style={{ fontSize: '14px' }}>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results */}
          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                {/* Match Score */}
                <div style={{ textAlign: 'center', marginBottom: '40px', padding: '40px 20px', border: 'var(--border)', borderRadius: 'var(--radius)' }}>
                  <div className="match-score" style={{ color: scoreColor(result.matchScore) }}>
                    {result.matchScore}%
                  </div>
                  <div className="match-score-label">Match Score</div>
                  <div className="progress-bar" style={{ width: '200px', margin: '16px auto 0' }}>
                    <motion.div 
                      className="progress-fill" 
                      initial={{ width: 0 }}
                      animate={{ width: `${result.matchScore}%` }}
                      transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                      style={{ background: scoreColor(result.matchScore) }} 
                    />
                  </div>
                </div>

                <div className="grid-2">
                  {/* Keyword Gaps */}
                  <div className="card">
                    <div className="insight-label">Keyword Gaps</div>
                    {result.missingKeywords?.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', marginTop: '4px' }}>
                        {result.missingKeywords.map((k, i) => (
                          <motion.span 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4 + (i * 0.05) }}
                            key={k} 
                            className="gap-tag"
                          >
                            <AlertCircle size={11} color="var(--text-muted)" />
                            {k}
                          </motion.span>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>No major keyword gaps found.</p>
                    )}

                    <hr className="divider" />
                    <div className="insight-label">Skill Gaps</div>
                    {result.skillGaps?.length > 0 ? (
                      result.skillGaps.map((s, i) => (
                        <motion.div 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.6 + (i * 0.1) }}
                          key={s} 
                          style={{ fontSize: '13px', color: 'var(--text-secondary)', padding: '4px 0', borderBottom: 'var(--border-soft)' }}
                        >
                          · {s}
                        </motion.div>
                      ))
                    ) : (
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Your skills align well with this role.</p>
                    )}

                    {result.skillGaps?.length > 0 && (
                      <div style={{ marginTop: '24px' }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={generateLearningPath}
                          disabled={learningPathLoading}
                          style={{ width: '100%', justifyContent: 'center', border: '1px dashed var(--border)' }}
                        >
                          {learningPathLoading ? 'Generating Path...' : <><BrainCircuit size={14} /> Bridge the Gap (AI Learning Path)</>}
                        </button>

                        <AnimatePresence>
                          {learningPath && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ marginTop: '16px', borderTop: '1px solid var(--border-soft)', paddingTop: '16px' }}>
                              {learningPath.map((path, idx) => (
                                <div key={idx} style={{ marginBottom: '16px' }}>
                                  <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>{path.skill}</div>
                                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', lineHeight: '1.4' }}>{path.importance}</p>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {path.resources?.map((res, i) => (
                                      <div key={i} style={{ fontSize: '11px', padding: '6px 10px', background: 'var(--bg-secondary)', borderRadius: '4px', border: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Sparkles size={10} color="var(--accent)" /> {res}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>

                  {/* Coach Insight */}
                  <div className="insight-card" style={{ alignSelf: 'start' }}>
                    <div className="insight-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Sparkles size={12} /> AI Coach Insight
                    </div>
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8, duration: 0.6 }}
                      style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.8' }}
                    >
                      {result.coachInsight}
                    </motion.p>
                    
                    <div style={{ marginTop: '30px' }}>
                      <button
                        className="btn btn-primary"
                        onClick={() => setView('tailored')}
                        style={{ width: '100%', padding: '16px', fontSize: '15px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(var(--accent-rgb), 0.2)' }}
                      >
                        <Sparkles size={16} /> Redesign & Tailor for this Job (Instant)
                      </button>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '12px' }}>
                        Your tailored content was already generated during analysis! Click to view your new redesigned profile.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  </main>
</div>
  );
}
