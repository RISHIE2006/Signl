'use client';
import Sidebar from '@/components/Sidebar';
import { 
  Chrome, Download, Search, Layout, 
  Zap, BrainCircuit, ArrowRight, ShieldCheck, 
  Layers, Command, Monitor
} from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  {
    icon: Layout,
    title: "LinkedIn Match Overlay",
    description: "Scores every job on your feed based on your resume, right inside the LinkedIn UI."
  },
  {
    icon: BrainCircuit,
    title: "AI Power-Parsing",
    description: "Extracts hidden requirements from job descriptions that traditional sites miss."
  },
  {
    icon: Zap,
    title: "1-Click Sync",
    description: "Instantly logs every job you view to your Signl Pipeline for 10X tracking."
  }
];

export default function ExtensionPage() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
          
          {/* Hero Section */}
          <div style={{ textAlign: 'center', padding: '80px 20px 60px' }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }}
              style={{ 
                width: '64px', height: '64px', background: 'var(--accent)', 
                borderRadius: '16px', display: 'flex', alignItems: 'center', 
                justifyContent: 'center', margin: '0 auto 24px', color: 'white',
                boxShadow: '0 8px 24px var(--accent-pale)'
              }}
            >
              <Chrome size={32} strokeWidth={2.5} />
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ fontSize: '42px', fontWeight: '800', marginBottom: '16px', letterSpacing: '-0.03em' }}
            >
              The 10X Career <br /> <span className="text-accent">Browser Mod</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              style={{ fontSize: '18px', color: 'var(--text-secondary)', marginBottom: '32px', maxWidth: '600px', margin: '0 auto 40px' }}
            >
              Stop switching tabs. Get real-time AI scoring and sentiment analysis 
              directly on LinkedIn, Indeed, and Glassdoor.
            </motion.p>
            
            <motion.div
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.2 }}
               style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}
            >
              <button className="btn btn-primary" style={{ height: '52px', padding: '0 32px', fontSize: '16px', borderRadius: '14px' }}>
                <Chrome size={20} /> Add to Chrome (Free)
              </button>
              <button className="btn btn-secondary" style={{ height: '52px', padding: '0 32px', fontSize: '16px', borderRadius: '14px' }}>
                <Monitor size={20} /> Desktop App
              </button>
            </motion.div>
          </div>

          {/* Feature Grid */}
          <div className="grid-3" style={{ marginBottom: '80px' }}>
            {features.map((f, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="card" 
                style={{ padding: '32px' }}
              >
                <div style={{ color: 'var(--accent)', marginBottom: '16px' }}>
                  <f.icon size={24} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '12px' }}>{f.title}</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{f.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Browser HUD Preview (Mockup) */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="card"
            style={{ 
              padding: '0', overflow: 'hidden', border: 'var(--border)', 
              background: 'var(--bg-secondary)', position: 'relative'
            }}
          >
            <div style={{ background: '#252526', padding: '12px 20px', display: 'flex', gap: '8px', alignItems: 'center' }}>
               <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff5f56' }} />
               <div style={{ width: '100px', height: '8px', borderRadius: '4px', background: 'var(--white-10)' }} />
            </div>
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <div style={{ 
                margin: '0 auto', width: '320px', background: 'var(--bg-card)', 
                border: 'var(--border)', borderRadius: '16px', padding: '24px',
                textAlign: 'left', boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                position: 'relative'
              }}>
                <div style={{ position: 'absolute', top: '-10px', right: '-10px', background: 'var(--accent)', color: 'white', fontSize: '10px', fontWeight: '700', padding: '4px 8px', borderRadius: '6px' }}>
                   OVERLAY ACTIVE
                </div>
                <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '4px' }}>Software Engineer II</h4>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>Google • Mountain View, CA</div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ flex: 1, height: '6px', background: 'var(--white-5)', borderRadius: '100px' }}>
                    <div style={{ width: '88%', height: '100%', background: 'var(--success)', borderRadius: '100px' }} />
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--success)' }}>88% MATCH</div>
                </div>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {['React', 'Go', 'Scalability'].map(tag => (
                    <span key={tag} style={{ fontSize: '10px', background: 'var(--accent-pale)', color: 'var(--accent)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--accent-10)' }}>{tag}</span>
                  ))}
                </div>
              </div>
              <div style={{ marginTop: '40px', fontSize: '14px', color: 'var(--text-muted)' }}>
                LinkedIn Overlay Simulation Mode
              </div>
            </div>
          </motion.div>

        </div>
      </main>
    </div>
  );
}
