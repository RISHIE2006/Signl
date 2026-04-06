'use client';
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Sidebar from '@/components/Sidebar';
import { getAnalyses } from '@/lib/store';
import { Sparkles, Mail, FileText, Copy, Check, ChevronRight, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CoverLetterPage() {
  const { user } = useUser();
  const [analyses, setAnalyses] = useState([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [type, setType] = useState('cover-letter'); // 'cover-letter' or 'cold-email'
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
      setAnalyses(getAnalyses(user.id));
    }
  }, [user]);

  const generate = async () => {
    if (!selectedAnalysis) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          resume: selectedAnalysis.resumeText, 
          jd: selectedAnalysis.jdText,
          type 
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Failed to generate content.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-container">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="page-header">
            <h1 className="page-title">Outreach Generator</h1>
            <p className="page-subtitle">Draft professional cover letters and cold emails in seconds.</p>
          </motion.div>

          <div className="grid-2" style={{ alignItems: 'start', gap: '32px' }}>
            {/* Selection Column */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="card" style={{ marginBottom: '24px' }}>
                <label className="form-label">1. Select a Recent Analysis</label>
                <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {analyses.length > 0 ? (
                    analyses.map(a => (
                      <button
                        key={a.id}
                        onClick={() => setSelectedAnalysis(a)}
                        style={{
                          textAlign: 'left',
                          padding: '12px 16px',
                          borderRadius: '8px',
                          border: selectedAnalysis?.id === a.id ? '2px solid var(--accent)' : '1px solid var(--border)',
                          background: selectedAnalysis?.id === a.id ? 'var(--accent-pale)' : 'var(--bg)',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>{a.jdText.split('\n')[0].substring(0, 40)}...</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Score: {a.matchScore}% · {new Date(a.createdAt).toLocaleDateString()}</div>
                      </button>
                    ))
                  ) : (
                    <div style={{ fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
                      No analyses found. Visit the <a href="/analyse" style={{ color: 'var(--accent)' }}>Analyser</a> first!
                    </div>
                  )}
                </div>
              </div>

              <div className="card">
                <label className="form-label">2. Choose Format</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <button
                    onClick={() => setType('cover-letter')}
                    className={`btn ${type === 'cover-letter' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ justifyContent: 'center' }}
                  >
                    <FileText size={16} /> Cover Letter
                  </button>
                  <button
                    onClick={() => setType('cold-email')}
                    className={`btn ${type === 'cold-email' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ justifyContent: 'center' }}
                  >
                    <Mail size={16} /> Cold Email
                  </button>
                </div>

                <button
                  className="btn btn-primary"
                  onClick={generate}
                  disabled={loading || !selectedAnalysis}
                  style={{ width: '100%', marginTop: '24px', justifyContent: 'center' }}
                >
                  {loading ? 'Generating...' : <><Sparkles size={16} /> Generate Outreach</>}
                </button>
              </div>
            </motion.div>

            {/* Result Column */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <AnimatePresence mode="wait">
                {result ? (
                  <motion.div key="result" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="card" style={{ position: 'relative', border: '1px solid var(--accent)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: '600' }}>{result.title || 'Generated Content'}</h3>
                      <button onClick={copyToClipboard} className="btn btn-ghost btn-sm" style={{ padding: '6px 10px' }}>
                        {copied ? <><Check size={14} color="var(--success)" /> Copied</> : <><Copy size={14} /> Copy</>}
                      </button>
                    </div>
                    <div style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', maxHeight: '500px', overflowY: 'auto' }}>
                      {result.content}
                    </div>
                  </motion.div>
                ) : (
                  <div key="placeholder" style={{ 
                    height: '100%', 
                    minHeight: '400px', 
                    border: '2px dashed var(--border)', 
                    borderRadius: 'var(--radius)', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: 'var(--text-muted)',
                    textAlign: 'center',
                    padding: '40px'
                  }}>
                    <div style={{ opacity: 0.3, marginBottom: '16px' }}>
                      {type === 'cover-letter' ? <FileText size={64} /> : <Mail size={64} />}
                    </div>
                    <p style={{ fontSize: '15px' }}>Your generated {type === 'cover-letter' ? 'cover letter' : 'email'} will appear here.</p>
                  </div>
                )}
              </AnimatePresence>

              {error && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)', fontSize: '13px' }}>
                  <AlertCircle size={14} /> {error}
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
