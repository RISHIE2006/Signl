'use client';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { getDNA } from '@/lib/store';
import { motion } from 'framer-motion';
import { Activity, Zap, Layers, Volume2, SearchCode, PieChart as PieChartIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip
} from 'recharts';

export default function DNAPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [dna, setDna] = useState(null);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) { router.push('/sign-in'); return; }
    
    // Simulate getting DNA data or setting default mock if no data exists
    let userDna = getDNA(user.id);
    if (!userDna) {
      userDna = {
        radar: [
          { subject: 'Clarity', A: 85, fullMark: 100 },
          { subject: 'Technical Depth', A: 70, fullMark: 100 },
          { subject: 'Conciseness', A: 65, fullMark: 100 },
          { subject: 'Confidence', A: 90, fullMark: 100 },
          { subject: 'STAR Structure', A: 60, fullMark: 100 },
        ],
        fillers: [
          { word: 'like', count: 42 },
          { word: 'um', count: 35 },
          { word: 'basically', count: 18 },
          { word: 'you know', count: 14 }
        ],
        paceTrend: [
          { session: '1', wpm: 120 }, { session: '2', wpm: 135 },
          { session: '3', wpm: 140 }, { session: '4', wpm: 128 },
          { session: '5', wpm: 150 },
        ],
        summary: "You speak with high confidence and strong clarity, but frequently drop the 'Result' in a STAR format. Your primary filler word is 'like'. You tend to speak faster during technical questions."
      };
    }
    setDna(userDna);
  }, [user, isLoaded, router]);

  if (!isLoaded || !dna) return null;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-container">

          <motion.div
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ marginBottom: '40px' }}
          >
            <h1 style={{ fontSize: '26px', fontWeight: '800', letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Activity size={24} color="var(--accent)" />
              Communication DNA
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '6px' }}>
              Your fingerprint of verbal habits, structural patterns, and physiological pace across all mock sessions.
            </p>
          </motion.div>

          <div className="grid-2">
            
            {/* Radar Chart */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              style={{
                background: 'var(--bg-card)', padding: '32px', borderRadius: '20px',
                border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-sm)'
              }}
            >
              <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PieChartIcon size={16} color="var(--text-muted)" /> Cognitive Profile
              </h3>
              <div style={{ width: '100%', height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={dna.radar}>
                    <PolarGrid stroke="var(--border)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 600 }} />
                    <Radar name="You" dataKey="A" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* AI Summary Breakdown */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              style={{
                background: 'linear-gradient(135deg, rgba(var(--accent-rgb),0.05), transparent)',
                padding: '32px', borderRadius: '20px',
                border: '1px solid rgba(var(--accent-rgb),0.15)', boxShadow: 'var(--shadow-sm)'
              }}
            >
              <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent)' }}>
                <SearchCode size={16} /> Synthesis Report
              </h3>
              <p style={{ fontSize: '15px', color: 'var(--text-primary)', lineHeight: '1.7', background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                {dna.summary}
              </p>

              <h4 style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginTop: '32px', marginBottom: '16px' }}>
                Top Verbal Crutches (Fillers)
              </h4>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {dna.fillers.map((f, i) => (
                  <div key={i} style={{
                    background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                    padding: '8px 14px', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '8px'
                  }}>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>&quot;{f.word}&quot;</span>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent)', background: 'rgba(var(--accent-rgb),0.1)', padding: '2px 8px', borderRadius: '100px' }}>
                      {f.count}x
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Speaking Pace Trend */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{
                gridColumn: 'span 2',
                background: 'var(--bg-card)', padding: '32px', borderRadius: '20px',
                border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-sm)'
              }}
            >
              <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Volume2 size={16} color="var(--text-muted)" /> Speaking Pace (WPM) Across Sessions
              </h3>
              <div style={{ width: '100%', height: '240px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dna.paceTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorWpm" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--success)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--success)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="session" stroke="var(--text-muted)" fontSize={11} tickMargin={10} axisLine={false} tickLine={false} />
                    <YAxis stroke="var(--text-muted)" fontSize={11} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{ background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: 'var(--shadow-md)', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.1))' }}
                      itemStyle={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600 }}
                    />
                    <Area type="monotone" dataKey="wpm" stroke="var(--success)" strokeWidth={3} fillOpacity={1} fill="url(#colorWpm)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

          </div>
        </div>
      </main>
    </div>
  );
}
