'use client';
import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import Sidebar from '@/components/Sidebar';
import { 
  Mic, MicOff, Volume2, VolumeX, 
  RotateCcw, StopCircle, Play, 
  BrainCircuit, Sparkles, ChevronRight,
  Info, AlertCircle, Zap, Trophy, Lock,
  FileText, Briefcase, Camera, CameraOff, CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ResumeManager from '@/components/ResumeManager';
import { getProfile } from '@/lib/store';
import { useBilling } from '@/hooks/useBilling';

export default function VoicePrepPage() {
  const { user, isLoaded } = useUser();
  const { canStartPrep, limits } = useBilling();
  const [stage, setStage] = useState('setup'); // setup, parsing, active, finished
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [config, setConfig] = useState({ company: '', role: '', language: 'English', jd: '' });
  
  const [resumeData, setResumeData] = useState(null);
  
  // Analytics
  const [useWebcam, setUseWebcam] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [totalWordsSpoken, setTotalWordsSpoken] = useState(0);
  const [fillerWordsCount, setFillerWordsCount] = useState(0);

  const recognitionRef = useRef(null);
  const synthRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const fillerWords = ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'literally'];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        
        recognitionRef.current.onresult = (event) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          setTranscript(currentTranscript);
          
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            if (currentTranscript.trim()) {
              handleSendVoiceMessage(currentTranscript);
            }
          }, 2000);
        };

        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };
      }
      synthRef.current = window.speechSynthesis;
    }

    if (user) {
      const profile = getProfile(user.id);
      if (profile) {
        setConfig(prev => ({ ...prev, role: profile.role || '', company: profile.company || '' }));
      }
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      stopWebcam();
    };
  }, [user]);

  const toggleWebcam = async () => {
    if (useWebcam) {
      stopWebcam();
      setUseWebcam(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setUseWebcam(true);
      } catch (err) {
        console.error("Webcam error:", err);
      }
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const speakText = (text) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = synthRef.current.getVoices();
    
    let preferredVoice;
    if (config.language === 'Hindi') {
      preferredVoice = voices.find(v => v.lang === 'hi-IN');
    } else if (config.language === 'Hinglish') {
      preferredVoice = voices.find(v => v.lang === 'en-IN') || voices.find(v => v.lang.startsWith('en-US'));
    } else {
      preferredVoice = voices.find(v => v.lang === 'en-US' && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha')))
        || voices.find(v => v.lang === 'en-US')
        || voices.find(v => v.lang.startsWith('en'));
    }
    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.lang = config.language === 'Hindi' ? 'hi-IN' : 'en-US';
    utterance.pitch = 1.0;
    utterance.rate = 1.05;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      startListening();
    };
    synthRef.current.speak(utterance);
  };

  const startListening = () => {
    if (!recognitionRef.current || isListening) return;
    try {
      setTranscript('');
      recognitionRef.current.start();
      setIsListening(true);
    } catch (err) {
      console.error('Failed to start recognition:', err);
    }
  };

  const stopListening = () => {
    if (!recognitionRef.current || !isListening) return;
    recognitionRef.current.stop();
    setIsListening(false);
  };

  const analyzeTranscript = (text) => {
    const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    setTotalWordsSpoken(prev => prev + words.length);
    
    let localFillers = 0;
    words.forEach(w => {
      if (fillerWords.includes(w)) localFillers++;
    });
    setFillerWordsCount(prev => prev + localFillers);
  };

  const handleSendVoiceMessage = async (voiceText) => {
    stopListening();
    if (!voiceText.trim() || loading) return;

    analyzeTranscript(voiceText);

    const userMsg = { role: 'user', content: voiceText };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setTranscript('');
    setLoading(true);

    try {
      const res = await fetch('/api/simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...config, 
          resumeText: resumeData?.text || '',
          language: config.language, 
          messages: newMessages, 
          persona: 'The Enthusiast' 
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const aiResponse = data.content;
      setMessages([...newMessages, { role: 'assistant', content: aiResponse }]);
      speakText(aiResponse);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startSession = async () => {
    if (!config.role || !config.company) return;
    setStage('parsing');
    setLoading(true);

    const extractedText = resumeData?.text || '';

    setStage('active');
    setSessionStartTime(Date.now());
    
    const greetings = {
      Hindi: `नमस्ते, ${config.company} में ${config.role} पद के लिए इंटरव्यू शुरू करें।`,
      Hinglish: `Hey, main ${config.company} mein ${config.role} ke liye interview dene ready hoon.`,
      English: `Hey, let's kick off the interview for ${config.role} at ${config.company}.`
    };
    const initialMsg = { role: 'user', content: greetings[config.language] || greetings.English };
    
    try {
      const res = await fetch('/api/simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...config, 
          resumeText: extractedText,
          language: config.language, 
          messages: [initialMsg], 
          persona: 'The Enthusiast' 
        })
      });
      const data = await res.json();
      const fallbacks = {
        English: "Hey! I'll be your interviewer today. Ready to dive in?"
      };
      const aiResponse = data.content || fallbacks.English;
      setMessages([initialMsg, { role: 'assistant', content: aiResponse }]);
      speakText(aiResponse);
    } catch (err) {
      setError("Failed to start AI session.");
    } finally {
      setLoading(false);
    }
  };

  const finishSession = () => {
    stopListening();
    stopWebcam();
    setStage('finished');
  };

  if (!isLoaded) return null;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-container" style={{ maxWidth: '900px' }}>
          
          <div className="page-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--accent-pale)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={22} />
              </div>
              <h1 className="page-title">AI Voice Coach & Behavioral Lab</h1>
            </div>
            <p className="page-subtitle">Real-time verbal simulations with advanced filler-word and pace tracking.</p>
          </div>

          <AnimatePresence mode="wait">
            {(stage === 'setup' || stage === 'parsing') && (
              <motion.div key="setup" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, y: -20 }} className="card" style={{ padding: '40px' }}>
                
                {stage === 'parsing' ? (
                  <div style={{ textAlign: 'center', padding: '60px 0' }}>
                    <div className="dot-bounce" style={{ margin: '0 auto 20px', width: '12px', height: '12px', background: 'var(--accent)', borderRadius: '50%' }}></div>
                    <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Initializing Audio Lab...</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>Processing resume and preparing TTS engines.</p>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '40px' }}>
                      <BrainCircuit size={32} color="var(--accent)" />
                      <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Configure Room</h2>
                    </div>

                    <div className="grid-2" style={{ marginBottom: '20px' }}>
                      <div className="form-group">
                        <label className="form-label">Target Company</label>
                        <input className="input" value={config.company} onChange={e => setConfig({...config, company: e.target.value})} placeholder="e.g. Google" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Role</label>
                        <input className="input" value={config.role} onChange={e => setConfig({...config, role: e.target.value})} placeholder="e.g. Product Manager" />
                      </div>
                    </div>

                    <div className="grid-2" style={{ marginBottom: '24px' }}>
                      <div className="form-group">
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Briefcase size={14} /> Job Description
                        </label>
                        <textarea 
                          className="textarea" 
                          value={config.jd} 
                          onChange={e => setConfig({...config, jd: e.target.value})}
                          placeholder="Paste JD for targeted drilling..."
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

                    <div className="grid-2" style={{ marginBottom: '32px' }}>
                      <div className="form-group">
                        <label className="form-label">Voice Language</label>
                        <select
                          className="input"
                          value={config.language}
                          onChange={e => setConfig({...config, language: e.target.value})}
                        >
                          <option value="English">English (American)</option>
                          <option value="Hindi">Hindi (हिन्दी)</option>
                          <option value="Hinglish">Hinglish (Hindi + English)</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Camera size={14} /> Simulation Realism
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', background: useWebcam ? 'var(--accent-pale)' : 'var(--bg)' }}>
                          <input type="checkbox" checked={useWebcam} onChange={toggleWebcam} style={{ width: '18px', height: '18px', accentColor: 'var(--accent)' }} />
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: '500' }}>Enable Preview Webcam</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>See yourself to practice eye contact.</div>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <button onClick={startSession} disabled={!config.role || !config.company || loading || !canStartPrep} className="btn btn-primary" style={{ padding: '16px 60px', borderRadius: '100px', fontSize: '16px', fontWeight: '600', opacity: (!config.role || !config.company || !canStartPrep) ? 0.5 : 1 }}>
                        {loading ? 'Initializing AI...' : !canStartPrep ? <><Lock size={18} style={{ marginRight: '8px' }} /> Pro Plan Required</> : 'Enter Live Audio Room'}
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {stage === 'active' && (
              <motion.div key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px', padding: '20px 0' }}>
                
                {useWebcam && (
                  <div style={{ width: '240px', height: '180px', borderRadius: '16px', overflow: 'hidden', background: '#000', border: '2px solid var(--border-soft)' }}>
                    <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                  </div>
                )}

                {/* Visualizer */}
                <div style={{ position: 'relative', marginTop: useWebcam ? '0' : '40px' }}>
                  <motion.div animate={{ scale: isSpeaking ? [1, 1.3, 1] : 1, opacity: isSpeaking ? [0.1, 0.3, 0.1] : 0 }} transition={{ repeat: Infinity, duration: 1.5 }} style={{ position: 'absolute', inset: -40, background: 'var(--accent)', borderRadius: '50%', filter: 'blur(40px)' }} />
                  <motion.div 
                    animate={{ scale: isSpeaking ? 1.1 : isListening ? 1.05 : 1 }}
                    style={{ 
                      width: '180px', height: '180px', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      background: isSpeaking ? 'var(--accent-pale)' : isListening ? 'var(--success-light)' : 'var(--bg-secondary)',
                      border: `4px solid ${isSpeaking ? 'var(--accent)' : isListening ? 'var(--success)' : 'var(--border-soft)'}`,
                      position: 'relative', zIndex: 1, transition: '0.3s'
                    }}
                  >
                    {isSpeaking ? <Volume2 size={48} color="var(--accent)" /> : isListening ? <Mic size={48} color="var(--success)" /> : <BrainCircuit size={48} opacity={0.2} />}
                    <div style={{ position: 'absolute', bottom: '-40px', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {isSpeaking ? 'AI is Speaking' : isListening ? 'Listening...' : 'Thinking...'}
                    </div>
                  </motion.div>
                </div>

                {/* Transcript */}
                <div className="card" style={{ width: '100%', minHeight: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', background: 'var(--bg-secondary)', border: 'none' }}>
                  <AnimatePresence mode="wait">
                    {transcript ? (
                      <motion.p key="t" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ fontSize: '20px', fontWeight: '500', fontStyle: 'italic', color: 'var(--text-primary)' }}>
                        "{transcript}..."
                      </motion.p>
                    ) : (
                      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '80%' }}>
                        {messages[messages.length - 1]?.content || 'Ready when you are.'}
                      </p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Controls */}
                <div style={{ display: 'flex', gap: '24px' }}>
                  <button onClick={() => isListening ? stopListening() : startListening()} style={{ width: '64px', height: '64px', borderRadius: '50%', border: 'var(--border)', background: isListening ? 'var(--success-light)' : 'var(--bg-card)', color: isListening ? 'var(--success)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}>
                    {isListening ? <Mic size={24} /> : <MicOff size={24} />}
                  </button>
                  <button onClick={finishSession} style={{ width: '64px', height: '64px', borderRadius: '50%', border: 'var(--border)', background: 'var(--danger-light)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <StopCircle size={24} />
                  </button>
                </div>
              </motion.div>
            )}

            {stage === 'finished' && (
              <motion.div key="finished" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ padding: '40px' }}>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--success-light)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                    <Trophy size={40} />
                  </div>
                  <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>Session Complete</h2>
                  <p style={{ color: 'var(--text-secondary)' }}>Review your verbal and analytical stats.</p>
                </div>
                
                <div className="grid-3" style={{ marginBottom: '40px' }}>
                  <div className="card-sm" style={{ background: 'var(--bg-secondary)', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Words Spoken</div>
                    <div style={{ fontSize: '24px', fontWeight: '700' }}>{totalWordsSpoken}</div>
                  </div>
                  <div className="card-sm" style={{ background: 'var(--bg-secondary)', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Filler Words</div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: fillerWordsCount > 5 ? 'var(--warning)' : 'var(--success)' }}>{fillerWordsCount}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>um, like, uh, etc.</div>
                  </div>
                  <div className="card-sm" style={{ background: 'var(--bg-secondary)', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Est. Pace</div>
                    <div style={{ fontSize: '24px', fontWeight: '700' }}>
                      {sessionStartTime ? Math.round(totalWordsSpoken / ((Date.now() - sessionStartTime) / 60000)) : 0} WPM
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button onClick={() => window.location.assign('/simulation')} className="btn btn-primary h-14">View Full Text Debrief</button>
                  <button onClick={() => window.location.reload()} className="btn btn-ghost">Practice Again</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </main>
    </div>
  );
}
