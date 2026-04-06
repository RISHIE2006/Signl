'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Target, AlertCircle, Sparkles, 
  RefreshCw, ChevronRight, CheckCircle2, XCircle,
  Lightbulb, BrainCircuit, ArrowRight, Copy, Mail, Linkedin
} from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { getDNA, saveDNA } from '@/lib/store';

export default function DebriefSection({ role, company, messages }: any) {
  const { user } = useUser();
  const [debrief, setDebrief] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDebrief = async () => {
      try {
        const res = await fetch('/api/debrief', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role, company, messages }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to generate debrief');
        }
        setDebrief(data);

        // Save DNA Pattern
        if (data.fingerprint && user) {
          try {
            const currentDNA = getDNA(user.id);
            if (!currentDNA) {
              const newDna = {
                radar: [
                  { subject: 'Clarity', A: data.fingerprint.radar['Clarity'] || 70, fullMark: 100 },
                  { subject: 'Technical Depth', A: data.fingerprint.radar['Technical Depth'] || 70, fullMark: 100 },
                  { subject: 'Conciseness', A: data.fingerprint.radar['Conciseness'] || 70, fullMark: 100 },
                  { subject: 'Confidence', A: data.fingerprint.radar['Confidence'] || 70, fullMark: 100 },
                  { subject: 'STAR Structure', A: data.fingerprint.radar['STAR Structure'] || 70, fullMark: 100 },
                ],
                fillers: data.fingerprint.fillers || [],
                paceTrend: [{ session: '1', wpm: data.fingerprint.estimatedWPM || 130 }],
                summary: data.fingerprint.synthesis || "Good start."
              };
              saveDNA(user.id, newDna);
            } else {
              // Append to history
              const sessionNum = currentDNA.paceTrend.length + 1;
              const newDna = { ...currentDNA };
              newDna.paceTrend.push({ session: sessionNum.toString(), wpm: data.fingerprint.estimatedWPM || 130 });
              
              // Smooth radar averages
              newDna.radar = newDna.radar.map((r: any) => ({
                ...r,
                A: Math.round((r.A * currentDNA.paceTrend.length + (data.fingerprint.radar[r.subject] || r.A)) / sessionNum)
              }));
              
              // Add new fillers
              const fpFillers = data.fingerprint.fillers || [];
              fpFillers.forEach((f: any) => {
                const existing = newDna.fillers.find((ef: any) => ef.word.toLowerCase() === f.word.toLowerCase());
                if (existing) {
                  existing.count += f.count;
                } else {
                  newDna.fillers.push(f);
                }
              });
              
              // Overwrite summary with the latest analysis
              newDna.summary = data.fingerprint.synthesis;
              saveDNA(user.id, newDna);
            }
          } catch(e) {
            console.error("Failed to save DNA", e);
          }
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadDebrief();
  }, [role, company, messages]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="mb-6 p-4 rounded-full bg-accent-pale text-accent"
        >
          <Sparkles size={40} />
        </motion.div>
        <h2 className="text-xl font-semibold mb-2">Analyzing your performance...</h2>
        <p className="text-white/40 max-w-xs">Our AI coach is reviewing the transcript to provide strategic feedback.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-danger-light rounded-2xl border border-danger/20">
        <AlertCircle size={40} className="mx-auto mb-4 text-danger" />
        <h2 className="text-xl font-semibold mb-2 text-danger">Something went wrong</h2>
        <p className="text-danger/60 mb-6">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="btn btn-primary"
        >
          <RefreshCw size={16} /> Try Again
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8 pb-20"
    >
      {/* Hero Header */}
      <div className="card p-8 bg-gradient-to-br from-white/[0.05] to-transparent border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <BrainCircuit size={120} />
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
          <div className="relative">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64" cy="64" r="58"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-white/5"
              />
              <motion.circle
                cx="64" cy="64" r="58"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray="364.4"
                initial={{ strokeDashoffset: 364.4 }}
                animate={{ strokeDashoffset: 364.4 - (364.4 * debrief.overallScore) / 10 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="text-accent"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black">{debrief.overallScore}</span>
              <span className="text-[10px] uppercase tracking-wider text-white/40">Score</span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-1">
            <div className="text-2xl font-bold text-accent">{debrief.starScore || 0}%</div>
            <div className="text-[10px] uppercase tracking-widest text-white/40">STAR Proficiency</div>
            <div className="w-24 h-1 bg-white/5 rounded-full mt-1 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${debrief.starScore || 0}%` }}
                className="h-full bg-accent"
              />
            </div>
          </div>

          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
              <h1 className="text-2xl font-bold tracking-tight">Interview Performance</h1>
              {debrief.readyToInterview ? (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/10 text-success text-xs font-semibold">
                  <CheckCircle2 size={12} /> READY
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-danger/10 text-danger text-xs font-semibold">
                  <XCircle size={12} /> NEEDS WORK
                </span>
              )}
            </div>
            <p className="text-white/60 leading-relaxed text-lg italic">
              "{debrief.verdict}"
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-2 gap-6">
        {/* Strengths */}
        <div className="space-y-4">
          <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-white/30 px-2">
            <Trophy size={14} /> Core Strengths
          </h3>
          <div className="space-y-3">
            {debrief.strengths.map((s: any, i: number) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="card-sm bg-success/5 border-success/10 hover:border-success/20 transition-all"
              >
                <div className="font-bold text-success mb-1">{s.title}</div>
                <div className="text-sm text-white/50 leading-relaxed">{s.description}</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Weaknesses */}
        <div className="space-y-4">
          <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-white/30 px-2">
            <Target size={14} /> Critical Gaps
          </h3>
          <div className="space-y-3">
            {debrief.weaknesses.map((w: any, i: number) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="card-sm bg-danger/5 border-danger/10 hover:border-danger/20 transition-all"
              >
                <div className="font-bold text-danger mb-1">{w.title}</div>
                <div className="text-sm text-white/50 leading-relaxed">{w.description}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Improvements */}
      <div className="card p-6 bg-accent-pale border-accent/20">
        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-accent mb-6">
          <Lightbulb size={14} /> Coaching Roadmap
        </h3>
        <div className="space-y-6">
          {debrief.topImprovements.map((item: any, i: number) => (
            <div key={i} className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                {i + 1}
              </div>
              <div>
                <div className="font-bold mb-1">{item.area}</div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-sm text-white/60 leading-relaxed">
                  {item.tip}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 7-Day Study Plan */}
      {debrief.studyPlan && (
        <div className="card p-6 border-white/10 bg-gradient-to-br from-white/[0.02] to-transparent">
          <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-white/80 mb-6">
            <Target size={14} /> 7-Day Personalized Study Plan
          </h3>
          <div className="space-y-4">
            {debrief.studyPlan.map((plan: any, i: number) => (
              <div key={i} className="flex flex-col md:flex-row gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition">
                <div className="flex-shrink-0 w-20 px-3 py-1.5 rounded-lg bg-accent/20 text-accent text-center text-xs font-bold uppercase tracking-wider">
                  {plan.day.replace('Day ', 'DAY\n')}
                </div>
                <div>
                  <div className="font-bold text-white mb-1 leading-snug">{plan.focus}</div>
                  <div className="text-sm text-white/60 leading-relaxed">{plan.action}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Outreach Deliverables */}
      <div className="grid md:grid-2 gap-6">
        <div className="card p-6 border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent">
          <div className="flex items-center justify-between mb-4">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-white/80">
              <Mail size={14} className="text-accent" /> Follow-up Email
            </h3>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(debrief.followUpEmail);
                alert('Copied to clipboard!');
              }}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition"
            >
              <Copy size={14} />
            </button>
          </div>
          <div className="p-4 rounded-xl bg-black/20 border border-white/5 text-xs text-white/50 font-mono leading-relaxed whitespace-pre-wrap max-h-[200px] overflow-y-auto">
            {debrief.followUpEmail}
          </div>
        </div>

        <div className="card p-6 border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent">
          <div className="flex items-center justify-between mb-4">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-white/80">
              <Linkedin size={14} className="text-accent" /> Recruiter Pitch
            </h3>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(debrief.recruiterPitch);
                alert('Copied to clipboard!');
              }}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition"
            >
              <Copy size={14} />
            </button>
          </div>
          <div className="p-4 rounded-xl bg-black/20 border border-white/5 text-xs text-white/50 font-mono leading-relaxed whitespace-pre-wrap max-h-[200px] overflow-y-auto">
            {debrief.recruiterPitch}
          </div>
        </div>
      </div>

      {/* Practice Topics */}
      <div className="flex flex-col items-center gap-6">
        <div className="text-center">
          <h4 className="text-xs font-bold uppercase tracking-widest text-white/30 mb-4">Focus Topics for Next Session</h4>
          <div className="flex flex-wrap justify-center gap-2">
            {debrief.practiceTopics.map((topic: string, i: number) => (
              <span key={i} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-medium">
                {topic}
              </span>
            ))}
          </div>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="btn btn-primary btn-full md:w-auto h-12 px-12 text-base rounded-full"
        >
          Start New Simulation <ArrowRight size={18} />
        </button>
      </div>
    </motion.div>
  );
}