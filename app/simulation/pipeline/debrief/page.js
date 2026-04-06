'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, CheckCircle2, Target, AlertCircle, RefreshCw, Layers } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { getDNA, saveDNA } from '@/lib/store';
import { useUser } from '@clerk/nextjs';

export default function PipelineDebriefPage() {
  const { user } = useUser();
  const [pipelineData, setPipelineData] = useState(null);
  const [debriefs, setDebriefs] = useState({});
  const [loading, setLoading] = useState(true);
  const [finalScore, setFinalScore] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cache = localStorage.getItem('pipeline_cache');
      if (cache) {
        const parsed = JSON.parse(cache);
        setPipelineData(parsed);
        processDebriefs(parsed);
      } else {
        setLoading(false);
      }
    }
  }, [user]);

  const processDebriefs = async (data) => {
    const { params, transcripts, rounds } = data;
    const results = {};
    let totalScore = 0;

    for (let i = 0; i < rounds.length; i++) {
       const msgs = transcripts[i] || [];
       if (msgs.length <= 1) continue; // Skipped round

       try {
         const res = await fetch('/api/debrief', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ role: params.role, company: params.company, messages: msgs })
         });
         const d = await res.json();
         results[rounds[i].id] = d;
         totalScore += (d.overallScore || 0);

         // Merge DNA
         if (d.fingerprint && user) {
           const cDna = getDNA(user.id) || { radar: [], fillers: [], paceTrend: [] };
           // We just capture the last round's DNA for the fingerprint append logic 
           // to prevent appending 5 times in a single session.
           if (i === rounds.length - 1) {
             const sessionNum = cDna.paceTrend.length + 1;
             cDna.paceTrend.push({ session: sessionNum.toString(), wpm: d.fingerprint.estimatedWPM || 130 });
             saveDNA(user.id, cDna);
           }
         }
       } catch (err) {
         console.warn("Failed round debrief", err);
       }
    }

    setDebriefs(results);
    const completedRounds = Object.keys(results).length;
    setFinalScore(completedRounds > 0 ? (totalScore / completedRounds).toFixed(1) : 0);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="app-layout">
        <Sidebar />
        <main className="main-content flex items-center justify-center">
          <div className="page-container text-center py-20">
            <h2 className="text-xl font-bold mb-4">Aggregating 5-Round Post-Mortem...</h2>
            <div className="dot-bounce mx-auto" style={{ width: '12px', height: '12px', background: 'var(--accent)' }}/>
          </div>
        </main>
      </div>
    );
  }

  if (!pipelineData) {
    return (
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <div className="page-container text-center mt-20">No pipeline data found.</div>
        </main>
      </div>
    );
  }

  const { rounds, params } = pipelineData;
  const isHire = finalScore >= 7.5;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-container" style={{ paddingBottom: '100px' }}>
          
          <div className="card p-8 bg-gradient-to-br from-white/[0.05] to-transparent border-white/10 mb-8 overflow-hidden relative">
            <Layers size={120} className="absolute top-0 right-0 p-8 opacity-5 text-accent" />
            <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
              <div className="relative">
                <div style={{ width: '120px', height: '120px', borderRadius: '50%', border: `8px solid ${isHire ? 'var(--success)' : 'var(--danger)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                  <span className="text-3xl font-black">{finalScore}</span>
                  <span className="text-[10px] text-white/50">AVERAGE</span>
                </div>
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-2">Final Hiring Committee Decision</h1>
                <p className="text-white/60 mb-4">{params.role} at {params.company}</p>
                {isHire ? (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/20 text-success font-bold">
                    <Trophy size={16}/> INCLINED TO HIRE
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-danger/10 border border-danger/20 text-danger font-bold">
                    <AlertCircle size={16}/> NOT INCLINED
                  </div>
                )}
              </div>
            </div>
          </div>

          <h3 className="text-lg font-bold mb-4">Round-by-Round Breakdown</h3>
          <div className="grid gap-6">
            {rounds.map((r, i) => {
              const res = debriefs[r.id];
              if (!res) return null;
              
              return (
                <motion.div key={r.id} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.1 }} className="card p-6 border-white/10">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-accent mb-1">{r.name}</h4>
                      <div className="text-xs text-white/50">{r.persona}</div>
                    </div>
                    <div className="text-xl font-black bg-white/5 px-3 py-1 rounded-lg">{res.overallScore}/10</div>
                  </div>
                  
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5 mb-4 text-sm text-white/80 italic">
                    "{res.verdict}"
                  </div>

                  <div className="grid md:grid-2 gap-4">
                    <div>
                      <div className="text-xs font-bold uppercase text-white/30 mb-2">Top Strength</div>
                      <div className="text-sm text-success">{res.strengths?.[0]?.description || 'None identified'}</div>
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase text-white/30 mb-2">Critical Gap</div>
                      <div className="text-sm text-danger">{res.weaknesses?.[0]?.description || 'None identified'}</div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

        </div>
      </main>
      <style>{`.dot-bounce { animation: dot-bounce 1s infinite; } @keyframes dot-bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }`}</style>
    </div>
  );
}
