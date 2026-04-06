'use client';
import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import Sidebar from '@/components/Sidebar';
import ResumeManager from '@/components/ResumeManager';
import CompanyAutocomplete from '@/components/CompanyAutocomplete';
import DebriefSection from '@/components/DebriefSection';
import { 
  Send, Sparkles, User, Bot, AlertCircle, 
  ChevronRight, BrainCircuit, Trophy, MessageSquare,
  ClipboardCheck, X, FileText, Code, CheckCircle,
  Briefcase, Play, Terminal, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';

const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

const PERSONAS = [
  { id: 'The Skeptic', label: 'The Skeptic', desc: 'Tough, rigorous, focus on gaps.', icon: '🕵️' },
  { id: 'The Enthusiast', label: 'The Enthusiast', desc: 'Warm, encouraging, probing.', icon: '🌟' },
  { id: 'The Technical Guru', label: 'Technical Guru', desc: 'Systems, logic, trade-offs.', icon: '💻' },
  { id: 'The Culture Fit', label: 'Culture Fit', desc: 'Soft skills & values focus.', icon: '🤝' }
];

export default function SimulationPage() {
  const { user, isLoaded } = useUser();
  const [stage, setStage] = useState('setup'); // setup, parsing, chat, debrief
  const [params, setParams] = useState({ 
    company: '', 
    role: '', 
    persona: 'The Enthusiast', 
    language: 'English', 
    jd: '',
    codingMode: false,
    codeLanguage: 'javascript'
  });
  const [resumeData, setResumeData] = useState(null);
  
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [code, setCode] = useState('// Write your code here...\nconsole.log("Hello Interviewer!");');
  const [consoleOutput, setConsoleOutput] = useState([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const startSimulation = async () => {
    if (!params.company || !params.role) return;
    setStage('parsing');
    setLoading(true);

    const extractedText = resumeData?.text || '';

    setStage('chat');
    
    // Initial greeting from AI
    const greetings = {
      Hindi: `नमस्ते, मैं ${params.company} में ${params.role} पद के लिए अपने इंटरव्यू के लिए तैयार हूँ।`,
      Hinglish: `Hey, main ${params.company} mein ${params.role} ke liye interview dene ready hoon.`,
      English: `Hey, I'm ready for my interview for the ${params.role} position at ${params.company}.`
    };
    const initialMsg = { role: 'user', content: greetings[params.language] || greetings.English };
    try {
      const res = await fetch('/api/simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...params, 
          resumeText: extractedText,
          messages: [initialMsg] 
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const fallbackGreeting = {
        Hindi: "मैं तैयार हूँ। आइए इंटरव्यू शुरू करें।",
        Hinglish: "Alright, let's start! Toh chalein interview shuru karte hain.",
        English: "Awesome, let's get started. Ready when you are."
      };
      setMessages([
        initialMsg, 
        { role: 'assistant', content: data.content || fallbackGreeting[params.language] || fallbackGreeting.English }
      ]);
    } catch (err) {
      setMessages([{ role: 'assistant', content: `Could not start simulation: ${err.message}. Please check your API key.` }]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const payload = {
        ...params,
        resumeText: resumeData?.text || '',
        messages: newMessages
      };
      
      if (params.codingMode) {
        // Embed the code state into the last user message invisibly for the AI
        payload.currentCode = code;
        payload.currentCodeLanguage = params.codeLanguage;
      }

      const res = await fetch('/api/simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const fallbackReply = {
        Hindi: "माफ़ करें, मैं आपकी बात समझ नहीं पाया। क्या आप दोहरा सकते हैं?",
        Hinglish: "Sorry yaar, main samajh nahi paaya. Can you repeat that?",
        English: "Sorry, I lost my train of thought. Could you repeat that?"
      };
      setMessages([...newMessages, { role: 'assistant', content: data.content || fallbackReply[params.language] || fallbackReply.English }]);
    } catch (err) {
      console.error(err);
      const errMsgs = {
        Hindi: `[त्रुटि: ${err.message}] कृपया पेज रीफ्रेश करें या अपनी API कुंजी की जाँच करें।`,
        Hinglish: `[Error: ${err.message}] Page refresh karo ya API key check karo.`,
        English: `[Error: ${err.message}] Please try refreshing the page or checking your API key.`
      };
      setMessages([...newMessages, { role: 'assistant', content: errMsgs[params.language] || errMsgs.English }]);
    } finally {
      setLoading(false);
    }
  };

  const runCode = () => {
    if (params.codeLanguage !== 'javascript') {
      setConsoleOutput([...consoleOutput, { type: 'system', content: `Execution for ${params.codeLanguage} is currently not supported in this sandbox. Only JavaScript is live.` }]);
      return;
    }
    
    setConsoleOutput([{ type: 'system', content: '== Executing JavaScript ==' }]);
    
    const originalLog = console.log;
    const logs = [];
    console.log = (...args) => {
      logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
    };

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

  if (!isLoaded) return null;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-container" style={{ maxWidth: stage === 'chat' && params.codingMode ? '1400px' : '900px', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 96px)', transition: 'max-width 0.3s' }}>
          
          <div className="page-header" style={{ marginBottom: '24px', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 className="page-title">Live Interview Simulation</h1>
              <span className="badge badge-purple">BETA</span>
            </div>
            <p className="page-subtitle">Interactive AI role-play with deep personalization and technical constraints.</p>
          </div>

          <AnimatePresence mode="wait">
            {(stage === 'setup' || stage === 'parsing') && (
              <motion.div 
                key="setup" 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -20 }}
                className="card"
                style={{ padding: '32px' }}
              >
                {stage === 'parsing' ? (
                  <div style={{ textAlign: 'center', padding: '60px 0' }}>
                    <div className="dot-bounce" style={{ margin: '0 auto 20px', width: '12px', height: '12px', background: 'var(--accent)', borderRadius: '50%' }}></div>
                    <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Initializing Simulation...</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>Parsing context and configuring AI interviewer persona.</p>
                  </div>
                ) : (
                  <>
                    <h3 style={{ marginBottom: '24px', fontSize: '16px' }}>Configure your simulation</h3>
                    
                    <div className="grid-2" style={{ marginBottom: '20px' }}>
                      <div className="form-group">
                        <label className="form-label">Target Company</label>
                        <CompanyAutocomplete value={params.company} onChange={e => setParams({...params, company: e.target.value})} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Position</label>
                        <input className="input" value={params.role} onChange={e => setParams({...params, role: e.target.value})} placeholder="e.g. Senior Software Engineer" />
                      </div>
                    </div>

                    <div className="grid-2" style={{ marginBottom: '24px' }}>
                      <div className="form-group">
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Briefcase size={14} /> Job Description (Optional)
                        </label>
                        <textarea 
                          className="textarea" 
                          value={params.jd} 
                          onChange={e => setParams({...params, jd: e.target.value})}
                          placeholder="Paste the job description here for laser-focused questions..."
                          style={{ height: '90px' }}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <FileText size={14} /> Your Resume
                        </label>
                        <div style={{ minHeight: '90px' }}>
                          <ResumeManager compact onUpdate={setResumeData} />
                        </div>
                      </div>
                    </div>

                    <div className="grid-2" style={{ marginBottom: '20px' }}>
                      <div className="form-group">
                        <label className="form-label">Interview Language</label>
                        <select 
                          className="input" 
                          value={params.language} 
                          onChange={e => setParams({...params, language: e.target.value})}
                        >
                          <option value="English">English (American)</option>
                          <option value="Hindi">Hindi (हिन्दी)</option>
                          <option value="Hinglish">Hinglish (Hindi + English)</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Code size={14} /> Technical Interview Mode
                        </label>
                        <div className="card-sm" style={{ padding: '0px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                           <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', cursor: 'pointer', background: params.codingMode ? 'var(--accent-pale)' : 'var(--bg)' }}>
                             <input type="checkbox" checked={params.codingMode} onChange={e => setParams({...params, codingMode: e.target.checked})} style={{ width: '18px', height: '18px', accentColor: 'var(--accent)' }} />
                             <div>
                               <div style={{ fontSize: '13px', fontWeight: '500' }}>Enable Live Code Editor</div>
                               <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>For engineering & data roles.</div>
                             </div>
                           </label>
                        </div>
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '24px' }}>
                      <label className="form-label">Choose Interviewer Personality</label>
                      <div className="grid-2" style={{ gap: '12px' }}>
                        {PERSONAS.map(p => (
                          <div 
                            key={p.id} 
                            onClick={() => setParams({...params, persona: p.id})}
                            className={`card-sm`}
                            style={{ 
                              cursor: 'pointer', 
                              border: params.persona === p.id ? '2px solid var(--accent)' : 'var(--border)',
                              background: params.persona === p.id ? 'var(--accent-pale)' : 'var(--bg)',
                              display: 'flex', gap: '12px', alignItems: 'center', transition: 'all 0.2s'
                            }}
                          >
                            <span style={{ fontSize: '24px' }}>{p.icon}</span>
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: '600' }}>{p.label}</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.desc}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <button 
                        className="btn btn-primary" 
                        onClick={startSimulation}
                        disabled={!params.company || !params.role}
                        style={{ padding: '12px 60px', borderRadius: '100px' }}
                      >
                        Enter Interview Room <ChevronRight size={16} />
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {stage === 'chat' && (
              <motion.div 
                key="chat" 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                style={{ 
                  flex: 1, display: 'flex', gap: '16px', overflow: 'hidden', 
                  height: '100%' 
                }}
              >
                {/* Chat Panel */}
                <div style={{ 
                  flex: params.codingMode ? '0 0 45%' : '1', 
                  display: 'flex', flexDirection: 'column', 
                  background: 'var(--bg-card)', border: 'var(--border)', borderRadius: 'var(--radius)',
                  overflow: 'hidden'
                }}>
                  {/* Chat Header */}
                  <div style={{ padding: '16px 20px', borderBottom: 'var(--border-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                        <Bot size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '600' }}>{params.persona} @ {params.company}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ fontSize: '11px', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)' }}></div> Live
                          </div>
                          {messages.length > 2 && (
                            <div style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              • {loading ? 'Analyzing...' : 'Impression: Positive'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        className="btn btn-primary btn-sm" 
                        onClick={() => setStage('debrief')}
                        style={{ background: 'var(--text-primary)', color: 'var(--bg)' }}
                      >
                        <ClipboardCheck size={14} /> Finish & Debrief
                      </button>
                    </div>
                  </div>

                  {/* Messages Container */}
                  <div 
                    ref={scrollRef}
                    style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}
                  >
                    {messages.map((ms, i) => (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        style={{ 
                          alignSelf: ms.role === 'user' ? 'flex-end' : 'flex-start',
                          maxWidth: '85%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: ms.role === 'user' ? 'flex-end' : 'flex-start'
                        }}
                      >
                        <div style={{ 
                          padding: '12px 16px', 
                          borderRadius: ms.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                          background: ms.role === 'user' ? 'var(--accent)' : 'var(--bg-secondary)',
                          color: ms.role === 'user' ? '#000000' : 'var(--text-primary)',
                          fontSize: '14px',
                          lineHeight: '1.5',
                          border: ms.role === 'user' ? 'none' : 'var(--border-soft)'
                        }}>
                          {ms.content}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', textTransform: 'uppercase' }}>
                          {ms.role === 'user' ? 'You' : params.persona}
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

                  {/* Input Area */}
                  <div style={{ padding: '20px', borderTop: 'var(--border-soft)' }}>
                    <div style={{ position: 'relative' }}>
                      <textarea 
                        className="textarea" 
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                        placeholder="Type your response... (Press Enter to send)"
                        style={{ minHeight: '60px', paddingRight: '50px', borderRadius: '12px' }}
                      />
                      <button 
                        onClick={sendMessage}
                        disabled={!input.trim() || loading}
                        style={{ 
                          position: 'absolute', right: '12px', bottom: '12px', 
                          background: 'var(--accent)', color: 'white', border: 'none', 
                          borderRadius: '8px', padding: '8px', display: 'flex', 
                          alignItems: 'center', justifyContent: 'center', opacity: input.trim() ? 1 : 0.4
                        }}
                      >
                        <Send size={18} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Optional Code Editor Panel */}
                {params.codingMode && (
                  <div style={{ 
                    flex: '1', 
                    background: '#1e1e1e', 
                    borderRadius: 'var(--radius)', 
                    overflow: 'hidden',
                    display: 'flex', flexDirection: 'column',
                    border: '1px solid #333'
                  }}>
                    <div style={{ padding: '10px 16px', background: '#252526', color: '#ccc', fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Code size={14}/> Live Technical Sandbox</span>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <button 
                          onClick={runCode}
                          style={{ 
                            background: 'var(--success)', color: '#000', border: 'none', borderRadius: '4px', 
                            padding: '2px 10px', fontSize: '11px', fontWeight: '700', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '4px'
                          }}
                        >
                          <Play size={10} strokeWidth={3} /> RUN
                        </button>
                        <select 
                          value={params.codeLanguage}
                          onChange={e => setParams({...params, codeLanguage: e.target.value})}
                          style={{ background: '#333', border: '1px solid #555', color: '#fff', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', outline: 'none', cursor: 'pointer' }}
                        >
                          <option value="javascript">JavaScript</option>
                          <option value="python">Python</option>
                          <option value="java">Java</option>
                          <option value="cpp">C++</option>
                          <option value="c">C</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <Editor
                        height="100%"
                        language={params.codeLanguage}
                        theme="vs-dark"
                        value={code}
                        onChange={(value) => setCode(value)}
                        options={{ minimap: { enabled: false }, fontSize: 13, padding: { top: 16 } }}
                      />
                    </div>
                    
                    {/* Console Output */}
                    <div style={{ 
                      height: '160px', background: '#000', borderTop: '1px solid #333', 
                      padding: '12px', display: 'flex', flexDirection: 'column'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div style={{ fontSize: '10px', fontWeight: '800', color: '#666', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Terminal size={12} /> Console Output
                        </div>
                        <button onClick={() => setConsoleOutput([])} style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer' }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                      <div style={{ flex: 1, overflowY: 'auto', fontFamily: 'monospace', fontSize: '12px' }}>
                        {consoleOutput.length === 0 ? (
                          <div style={{ color: '#333' }}>No output yet. Click RUN to execute.</div>
                        ) : (
                          consoleOutput.map((log, i) => (
                            <div key={i} style={{ 
                              color: log.type === 'error' ? '#f44' : log.type === 'system' ? '#0af' : '#ccc',
                              marginBottom: '2px',
                              opacity: log.type === 'system' ? 0.6 : 1
                            }}>
                              {log.type === 'error' ? '▶ ' : log.type === 'log' ? '› ' : ''}{log.content}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
            
            {stage === 'debrief' && (
              <motion.div 
                key="debrief" 
                initial={{ opacity: 0, scale: 0.98 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 0.98 }}
                style={{ flex: 1, overflowY: 'auto' }}
                className="hide-scrollbar"
              >
                <div style={{ padding: '20px', borderBottom: 'var(--border-soft)', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => window.location.reload()}>
                    <ChevronRight size={14} style={{ transform: 'rotate(180deg)', marginRight: '4px' }} /> New Interview
                  </button>
                  <h2 style={{ fontSize: '16px', fontWeight: '600' }}>Interview Debrief & Study Plan</h2>
                </div>
                <DebriefSection 
                  role={params.role} 
                  company={params.company} 
                  messages={messages} 
                />
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </main>
      <style>{`
        .dot-bounce { animation: dot-bounce 1s infinite; }
        @keyframes dot-bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
      `}</style>
    </div>
  );
}
