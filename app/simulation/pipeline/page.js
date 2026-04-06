'use client';
import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import Sidebar from '@/components/Sidebar';
import CompanyAutocomplete from '@/components/CompanyAutocomplete';
import { 
  Send, Bot, ChevronRight, MessageSquare, ClipboardCheck, Code,
  Play, Terminal, Trash2, ArrowRight, ShieldCheck, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

const PIPELINE_ROUNDS = [
  { id: 'recruiter', name: 'Recruiter Screen', desc: '5-min culture & background check', persona: 'The Culture Fit', mode: 'text', timeGoal: 5 },
  { id: 'coding', name: 'Technical 1', desc: 'Algorithms & Coding', persona: 'The Technical Guru', mode: 'code', timeGoal: 15 },
  { id: 'sysdesign', name: 'Technical 2', desc: 'System Design & Architecture', persona: 'The Architect', mode: 'text', timeGoal: 15 },
  { id: 'panel', name: 'Behavioral Panel', desc: 'Dual-Persona Panel (Sarah & David)', persona: 'Dual Panel', mode: 'text', timeGoal: 15 },
  { id: 'executive', name: 'Final Executive', desc: 'High-stakes founder interview', persona: 'The Founder', mode: 'text', timeGoal: 10 }
];

export default function PipelinePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  
  const [stage, setStage] = useState('setup'); // setup, round, debrief
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  
  const [params, setParams] = useState({ company: '', role: '', language: 'English' });
  const [transcripts, setTranscripts] = useState([[], [], [], [], []]); // Messages for each round
  
  const [input, setInput] = useState('');
  const [code, setCode] = useState('// Write your solution here...\n');
  const [consoleOutput, setConsoleOutput] = useState([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [transcripts, currentRoundIndex]);

  const currentRound = PIPELINE_ROUNDS[currentRoundIndex];
  const messages = transcripts[currentRoundIndex] || [];

  const startPipeline = () => {
    if (!params.company || !params.role) return;
    setStage('round');
    startRound(0);
  };

  const startRound = async (index) => {
    setCurrentRoundIndex(index);
    setLoading(true);
    const roundDef = PIPELINE_ROUNDS[index];
    
    // Initial greeting based on round type
    const initialPromptMap = {
      recruiter: `Hi, I am ready for the recruiter screen for the ${params.role} role at ${params.company}.`,
      coding: `Hi, I am ready for the coding round.`,
      sysdesign: `Hi, I am ready for the System Design round.`,
      panel: `Hi, I am ready for the Behavioral Panel.`,
      executive: `Hello, I am ready for the final Executive round.`
    };

    const initialMsg = { role: 'user', content: initialPromptMap[roundDef.id] };
    
    try {
      const res = await fetch('/api/simulation/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...params,
          roundDef,
          messages: [initialMsg]
        })
      });
      const data = await res.json();
      
      const newTranscripts = [...transcripts];
      newTranscripts[index] = [initialMsg, { role: 'assistant', content: data.content || "Let's begin." }];
      setTranscripts(newTranscripts);
    } catch (err) {
      console.error(err);
      const newTranscripts = [...transcripts];
      newTranscripts[index] = [initialMsg, { role: 'assistant', content: "Failed to connect to AI for this round." }];
      setTranscripts(newTranscripts);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg = { role: 'user', content: input };
    const newMessages = [...messages, userMsg];
    
    // Optimistic update
    const updatedTranscripts = [...transcripts];
    updatedTranscripts[currentRoundIndex] = newMessages;
    setTranscripts(updatedTranscripts);
    
    setInput('');
    setLoading(true);

    try {
      const payload = {
        ...params,
        roundDef: currentRound,
        messages: newMessages
      };
      
      if (currentRound.mode === 'code') {
        payload.currentCode = code;
        payload.currentCodeLanguage = 'javascript';
      }

      const res = await fetch('/api/simulation/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      updatedTranscripts[currentRoundIndex] = [...newMessages, { role: 'assistant', content: data.content || "Could you clarify?" }];
      setTranscripts([...updatedTranscripts]);
    } catch (err) {
      updatedTranscripts[currentRoundIndex] = [...newMessages, { role: 'assistant', content: "[Error] Failed to get response." }];
      setTranscripts([...updatedTranscripts]);
    } finally {
      setLoading(false);
    }
  };

  const advancePipeline = () => {
    if (currentRoundIndex < PIPELINE_ROUNDS.length - 1) {
      startRound(currentRoundIndex + 1);
    } else {
      finishPipeline();
    }
  };

  const finishPipeline = () => {
    // Navigate to unified debrief view, passing data via localStorage temporarily or via query
    if (typeof window !== 'undefined') {
      localStorage.setItem('pipeline_cache', JSON.stringify({ params, transcripts, rounds: PIPELINE_ROUNDS }));
      router.push('/simulation/pipeline/debrief');
    }
  };

  const runCode = () => {
    setConsoleOutput([{ type: 'system', content: '== Executing JavaScript ==' }]);
    const originalLog = console.log;
    const logs = [];
    console.log = (...args) => { logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')); };
    try {
      const runner = new Function(code);
      runner();
      setConsoleOutput(prev => [...prev, ...logs.map(l => ({ type: 'log', content: l })), { type: 'system', content: '== Execution Complete ==' }]);
    } catch (err) {
      setConsoleOutput(prev => [...prev, { type: 'error', content: err.message }]);
    } finally {
      console.log = originalLog;
    }
  };

  if (!isLoaded || !user) return null;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-container" style={{ maxWidth: stage === 'round' && currentRound?.mode === 'code' ? '1400px' : '900px', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 96px)', transition: 'max-width 0.3s' }}>
          
          <div className="page-header" style={{ marginBottom: '24px', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 className="page-title">Multi-Round Pipeline Simulation</h1>
                <span className="badge badge-purple">PRO EXCLUSIVE</span>
              </div>
              <p className="page-subtitle">Simulate a full 5-stage interview loop back-to-back.</p>
            </div>
            
            {stage === 'round' && (
              <div style={{ display: 'flex', gap: '4px' }}>
                {PIPELINE_ROUNDS.map((r, i) => (
                  <div key={i} style={{ 
                    width: '32px', height: '6px', borderRadius: '4px',
                    background: i < currentRoundIndex ? 'var(--success)' : i === currentRoundIndex ? 'var(--accent)' : 'var(--bg-secondary)',
                    opacity: i <= currentRoundIndex ? 1 : 0.5
                  }} />
                ))}
              </div>
            )}
          </div>

          <AnimatePresence mode="wait">
            {stage === 'setup' && (
              <motion.div 
                key="setup" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                className="card" style={{ padding: '32px' }}
              >
                <div style={{ marginBottom: '32px', display: 'flex', gap: '16px', background: 'rgba(var(--accent-rgb), 0.05)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(var(--accent-rgb), 0.15)' }}>
                  <ShieldCheck size={28} color="var(--accent)" style={{ flexShrink: 0 }} />
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '8px' }}>The Gauntlet Awaits</h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>You are about to enter a 5-round, multi-persona interview. It is designed to test your endurance, consistency, and ability to pivot between different interview styles (HR, Coding, Design, Panel, Founder). Make sure you have ~60 minutes.</p>
                  </div>
                </div>

                <div className="grid-2" style={{ marginBottom: '24px' }}>
                  <div className="form-group">
                    <label className="form-label">Target Company</label>
                    <CompanyAutocomplete value={params.company} onChange={e => setParams({...params, company: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Target Position</label>
                    <input className="input" value={params.role} onChange={e => setParams({...params, role: e.target.value})} placeholder="e.g. Senior Software Engineer" />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '40px' }}>
                  <button 
                    className="btn btn-primary" onClick={startPipeline} disabled={!params.company || !params.role}
                    style={{ padding: '14px 60px', borderRadius: '100px', fontSize: '15px' }}
                  >
                    Start Full Loop Pipeline <ArrowRight size={18} />
                  </button>
                </div>
              </motion.div>
            )}

            {stage === 'round' && (
              <motion.div 
                key={`round-${currentRoundIndex}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                style={{ flex: 1, display: 'flex', gap: '16px', overflow: 'hidden', height: '100%' }}
              >
                {/* Chat Panel */}
                <div style={{ 
                  flex: currentRound.mode === 'code' ? '0 0 45%' : '1', 
                  display: 'flex', flexDirection: 'column', 
                  background: 'var(--bg-card)', border: 'var(--border)', borderRadius: 'var(--radius)',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  {/* Round Header */}
                  <div style={{ padding: '16px 20px', borderBottom: 'var(--border-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--accent-light), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4)' }}>
                        {currentRoundIndex + 1}
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '700' }}>{currentRound.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{currentRound.persona}</div>
                      </div>
                    </div>
                    
                    <button 
                      className="btn btn-outline btn-sm" 
                      onClick={advancePipeline}
                      style={{ fontSize: '12px' }}
                    >
                      {currentRoundIndex === PIPELINE_ROUNDS.length - 1 ? (
                        <><ClipboardCheck size={14}/> Finish Pipeline</>
                      ) : (
                        <>Advance to Next Round <ChevronRight size={14}/></>
                      )}
                    </button>
                  </div>

                  {/* Messages */}
                  <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {messages.map((ms, i) => (
                      <motion.div 
                        key={i} initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                        style={{ alignSelf: ms.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%', display: 'flex', flexDirection: 'column', alignItems: ms.role === 'user' ? 'flex-end' : 'flex-start' }}
                      >
                        <div style={{ 
                          padding: '12px 16px', 
                          borderRadius: ms.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                          background: ms.role === 'user' ? 'var(--accent)' : 'var(--bg-secondary)',
                          color: ms.role === 'user' ? '#fff' : 'var(--text-primary)',
                          fontSize: '14px', lineHeight: '1.5',
                          border: ms.role === 'user' ? 'none' : '1px solid var(--glass-border)'
                        }}>
                          {ms.content}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', textTransform: 'uppercase' }}>
                          {ms.role === 'user' ? 'You' : currentRound.persona}
                        </div>
                      </motion.div>
                    ))}
                    {loading && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ alignSelf: 'flex-start', padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: '18px 18px 18px 4px', display: 'flex', gap: '4px' }}>
                        <div className="dot-bounce" style={{ width: '6px', height: '6px', background: 'var(--text-muted)', borderRadius: '50%' }}></div>
                        <div className="dot-bounce" style={{ width: '6px', height: '6px', background: 'var(--text-muted)', borderRadius: '50%', animationDelay: '0.2s' }}></div>
                        <div className="dot-bounce" style={{ width: '6px', height: '6px', background: 'var(--text-muted)', borderRadius: '50%', animationDelay: '0.4s' }}></div>
                      </motion.div>
                    )}
                  </div>

                  {/* Input */}
                  <div style={{ padding: '20px', borderTop: 'var(--border-soft)' }}>
                    <div style={{ position: 'relative' }}>
                      <textarea 
                        className="textarea" 
                        value={input} onChange={e => setInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                        placeholder="Type your response... (Press Enter to send)"
                        style={{ minHeight: '60px', paddingRight: '50px', borderRadius: '12px' }}
                      />
                      <button 
                        onClick={sendMessage} disabled={!input.trim() || loading}
                        style={{ position: 'absolute', right: '12px', bottom: '12px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '8px', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: input.trim() ? 1 : 0.4 }}
                      >
                        <Send size={18} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Code Editor */}
                {currentRound.mode === 'code' && (
                  <div style={{ flex: '1', background: '#1e1e1e', borderRadius: 'var(--radius)', overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1px solid #333' }}>
                    <div style={{ padding: '10px 16px', background: '#252526', color: '#ccc', fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Code size={14}/> IDE</span>
                      <button onClick={runCode} style={{ background: 'var(--success)', color: '#000', border: 'none', borderRadius: '4px', padding: '2px 10px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Play size={10} strokeWidth={3} /> RUN
                      </button>
                    </div>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <Editor height="100%" language="javascript" theme="vs-dark" value={code} onChange={setCode} options={{ minimap: { enabled: false }, fontSize: 13, padding: { top: 16 } }} />
                    </div>
                    <div style={{ height: '160px', background: '#000', borderTop: '1px solid #333', padding: '12px', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div style={{ fontSize: '10px', fontWeight: '800', color: '#666', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}><Terminal size={12} /> Console</div>
                        <button onClick={() => setConsoleOutput([])} style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer' }}><Trash2 size={12} /></button>
                      </div>
                      <div style={{ flex: 1, overflowY: 'auto', fontFamily: 'monospace', fontSize: '12px' }}>
                        {consoleOutput.length === 0 ? <div style={{ color: '#333' }}>No output.</div> : consoleOutput.map((l, i) => <div key={i} style={{ color: l.type === 'error' ? '#f44' : l.type === 'system' ? '#0af' : '#ccc', opacity: l.type === 'system' ? 0.6 : 1 }}>{l.content}</div>)}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      <style>{`.dot-bounce { animation: dot-bounce 1s infinite; } @keyframes dot-bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }`}</style>
    </div>
  );
}
