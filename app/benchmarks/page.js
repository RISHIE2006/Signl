'use client';
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import Sidebar from '@/components/Sidebar';
import { getApplications, getProfile, getBenchmarks, saveBenchmarks } from '@/lib/store';
import { TrendingDown, Users, Building2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STAGES = ['Resume', 'HR Screen', 'Technical', 'Final Round', 'Offer'];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

export default function BenchmarksPage() {
  const { user, isLoaded } = useUser();
  const [apps, setApps] = useState([]);
  const [profile, setProfile] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBenchmarks = async (forceRefresh = false) => {
    if (!user) return;
    
    if (!forceRefresh) {
      const cached = getBenchmarks(user.id);
      if (cached && cached.fetchedAt) {
        setData(cached);
        setLoading(false);
        return;
      }
    }
    
    setRefreshing(true);
    if (!data) setLoading(true);

    try {
      const appsData = getApplications(user.id) || [];
      const safeAppsData = Array.isArray(appsData) ? appsData : [];
      const uniqueRoles = [...new Set(safeAppsData.map(a => a.role).filter(Boolean))].slice(0, 3);

      const res = await fetch('/api/benchmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roles: uniqueRoles })
      });

      if (res.ok) {
        const result = await res.json();
        result.fetchedAt = new Date().toISOString();
        setData(result);
        saveBenchmarks(user.id, result);
      } else {
        const errorText = await res.text();
        console.error("Benchmarks API returned an error:", res.status, errorText);
      }
    } catch (err) {
      console.error("Failed to load benchmarks:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!isLoaded || !user) return;
    const userApps = getApplications(user.id) || [];
    setApps(Array.isArray(userApps) ? userApps : []);
    setProfile(getProfile(user.id));
    fetchBenchmarks();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user]);

  const successRate = apps.length > 0
    ? Math.round((apps.filter(a => a.stage === 'Offer').length / apps.length) * 100)
    : 0;

  const stageBreakdown = STAGES.map(stage => ({
    stage,
    count: apps.filter(a => a.stage === stage).length,
  }));

  const roleGroups = {};
  apps.forEach(a => {
    if (!roleGroups[a.role]) roleGroups[a.role] = [];
    roleGroups[a.role].push(a);
  });

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-container">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 className="page-title">Market Benchmarks</h1>
              <p className="page-subtitle">See how your funnel compares to dynamic real-world industry averages.</p>
            </div>
            {data && (
              <button 
                className="btn btn-ghost btn-sm" 
                onClick={() => fetchBenchmarks(true)} 
                disabled={refreshing}
                style={{ fontSize: '13px' }}
              >
                <RefreshCw size={14} className={refreshing ? 'spin' : ''} style={{ marginRight: '6px' }} />
                Refresh Data
              </button>
            )}
          </motion.div>

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="card empty-state" style={{ padding: '80px 20px' }}>
                <div className="loading-spinner" style={{ marginBottom: '16px', width: '24px', height: '24px', borderWidth: '3px' }} />
                <p>Analyzing current job market data using AI...</p>
              </motion.div>
            ) : data ? (
              <motion.div key="content" variants={container} initial="hidden" animate="show">
                {/* Market vs User hero metrics */}
                <div className="grid-3" style={{ marginBottom: '24px' }}>
                  <motion.div variants={item} className="card" style={{ textAlign: 'center', padding: '32px' }}>
                    <div style={{ fontSize: '42px', fontWeight: '700', letterSpacing: '-0.03em', lineHeight: 1 }}>{data.marketAvgSuccessRate}%</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Market Avg. Success Rate</div>
                  </motion.div>
                  <motion.div variants={item} className="card" style={{ textAlign: 'center', padding: '32px' }}>
                    <div style={{ fontSize: '42px', fontWeight: '700', letterSpacing: '-0.03em', lineHeight: 1, color: successRate > data.marketAvgSuccessRate ? 'var(--success)' : 'inherit' }}>
                      {successRate}%
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Your Success Rate</div>
                  </motion.div>
                  <motion.div variants={item} className="card" style={{ textAlign: 'center', padding: '32px' }}>
                    <div style={{ fontSize: '42px', fontWeight: '700', letterSpacing: '-0.03em', lineHeight: 1 }}>{data.avgTechnicalDropoff}%</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Avg. Technical Drop-off</div>
                  </motion.div>
                </div>

                {/* Drop-off by company + Stage comparison */}
                <div className="grid-2" style={{ marginBottom: '24px', alignItems: 'start' }}>
                  {/* Drop-off by Company */}
                  <motion.div variants={item} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '20px 20px 16px' }}>
                      <Building2 size={14} color="var(--text-muted)" />
                      <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Drop-off by Sector</span>
                    </div>
                    <table className="data-table" style={{ margin: 0 }}>
                      <thead>
                        <tr>
                          <th>Sector</th>
                          <th>Resume</th>
                          <th>Technical</th>
                          <th>Final</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.sectors.map(c => (
                          <tr key={c.name}>
                            <td style={{ fontWeight: '500' }}>{c.name}</td>
                            <td><span className="badge badge-slate">{c.resumeDropoff}%</span></td>
                            <td><span className="badge badge-purple">{c.technicalDropoff}%</span></td>
                            <td><span className="badge badge-amber">{c.finalDropoff}%</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div style={{ padding: '12px 20px', fontSize: '11px', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderTop: 'var(--border-soft)' }}>
                      Last updated: {new Date(data.fetchedAt).toLocaleString()}
                    </div>
                  </motion.div>

                  {/* Your Stage Breakdown */}
                  <motion.div variants={item} className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                      <TrendingDown size={14} color="var(--text-muted)" />
                      <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Your Stage Breakdown</span>
                    </div>
                    {apps.length === 0 ? (
                      <div className="empty-state" style={{ padding: '20px 0' }}>
                        <p>Log applications to see your personal breakdown.</p>
                      </div>
                    ) : (
                      <div>
                        {stageBreakdown.map((row, i) => (
                          <div key={row.stage} className="funnel-row" style={{ marginBottom: i < stageBreakdown.length - 1 ? '16px' : 0 }}>
                            <div className="funnel-stage-name">{row.stage}</div>
                            <div className="funnel-bar-wrap">
                              <div className="funnel-bar" style={{ width: apps.length ? `${(row.count / apps.length) * 100}%` : '0%' }} />
                            </div>
                            <div className="funnel-count">{row.count}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                </div>
              </motion.div>
            ) : (
              <motion.div className="card empty-state">
                <p>Failed to load benchmark data.</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Insights by Role */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }} className="card" style={{ marginTop: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <Users size={14} color="var(--text-muted)" />
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Your Insights by Role</span>
            </div>
            {Object.keys(roleGroups).length === 0 ? (
              <div className="empty-state" style={{ padding: '20px 0' }}>
                <p>Log applications to see role-specific patterns.</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Role</th>
                    <th>Applications</th>
                    <th>Furthest Stage</th>
                    <th>Offers</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(roleGroups).map(([role, roleApps]) => {
                    const furthest = roleApps.reduce((best, a) => {
                      const idx = STAGES.indexOf(a.stage);
                      const bestIdx = STAGES.indexOf(best);
                      return idx > bestIdx ? a.stage : best;
                    }, 'Resume');
                    const offers = roleApps.filter(a => a.stage === 'Offer').length;
                    return (
                      <tr key={role}>
                        <td>{role}</td>
                        <td>{roleApps.length}</td>
                        <td><span className="badge badge-slate">{furthest}</span></td>
                        <td>{offers > 0 ? <span className="badge badge-success">{offers}</span> : <span style={{ color: 'var(--text-muted)' }}>0</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </motion.div>

        </div>
      </main>
      <style>{`
        @keyframes spin-anim { 100% { transform: rotate(360deg); } }
        .spin { animation: spin-anim 1s linear infinite; }
      `}</style>
    </div>
  );
}
