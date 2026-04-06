'use client';
import { useEffect, useState, useMemo } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { getApplications, updateApplication, deleteApplication } from '@/lib/store';
import { FilePlus, Search, Trash2, ChevronRight, SlidersHorizontal, X, Lock } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useBilling } from '@/hooks/useBilling';

const STAGES = ['Resume', 'HR Screen', 'Technical', 'Final Round', 'Offer', 'Rejected', 'Ghosted'];

const stageColors = {
  Resume: 'badge-slate',
  'HR Screen': 'badge-blue',
  Technical: 'badge-purple',
  'Final Round': 'badge-amber',
  Offer: 'badge-success',
  Rejected: 'badge-danger',
  Ghosted: 'badge-muted',
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const row = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function ApplicationsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [apps, setApps] = useState([]);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('All');
  const [editingStage, setEditingStage] = useState(null); // appId whose stage dropdown is open
  const [deleteConfirm, setDeleteConfirm] = useState(null); // appId pending delete
  const [mounted, setMounted] = useState(false);
  const { canAddApplication } = useBilling();

  useEffect(() => {
    setMounted(true);
    if (!isLoaded) return;
    if (!user) { router.push('/sign-in'); return; }
    setApps(getApplications(user.id));
  }, [user, isLoaded, router]);

  const filtered = useMemo(() => {
    return apps.filter(a => {
      const matchStage = stageFilter === 'All' || a.stage === stageFilter;
      const matchSearch = !search.trim() ||
        a.company.toLowerCase().includes(search.toLowerCase()) ||
        a.role.toLowerCase().includes(search.toLowerCase());
      return matchStage && matchSearch;
    });
  }, [apps, stageFilter, search]);

  const changeStage = (appId, newStage) => {
    updateApplication(user.id, appId, { stage: newStage });
    setApps(prev => prev.map(a => a.id === appId ? { ...a, stage: newStage } : a));
    setEditingStage(null);
  };

  const handleDelete = (appId) => {
    deleteApplication(user.id, appId);
    setApps(prev => prev.filter(a => a.id !== appId));
    setDeleteConfirm(null);
  };

  if (!isLoaded || !mounted) return null;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-container">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="page-header"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
          >
            <div>
              <h1 className="page-title">My Applications</h1>
              <p className="page-subtitle">{apps.length} total · {filtered.length} shown</p>
            </div>
            {canAddApplication ? (
              <Link href="/log" className="btn btn-primary">
                <FilePlus size={16} /> Log New
              </Link>
            ) : (
              <Link href="/billing" className="btn btn-primary" style={{ background: 'var(--accent)', borderColor: 'var(--accent)' }}>
                <Lock size={16} /> Unlock Pro
              </Link>
            )}
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            style={{ marginBottom: '20px' }}
          >
            {/* Stage chips */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px', alignItems: 'center' }}>
              <SlidersHorizontal size={14} color="var(--text-muted)" />
              {['All', ...STAGES].map(s => (
                <button
                  key={s}
                  className={`chip ${stageFilter === s ? 'active' : ''}`}
                  onClick={() => setStageFilter(s)}
                  style={{ fontSize: '12px' }}
                >
                  {s}
                </button>
              ))}
            </div>
            {/* Search */}
            <div style={{ position: 'relative', maxWidth: '380px' }}>
              <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                className="input"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search company or role..."
                style={{ paddingLeft: '36px', height: '38px' }}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}>
                  <X size={14} />
                </button>
              )}
            </div>
          </motion.div>

          {/* Table */}
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card empty-state"
              style={{ padding: '60px 20px' }}
            >
              {apps.length === 0 ? (
                <>
                  <p style={{ marginBottom: '16px' }}>No applications logged yet.</p>
                  <Link href="/log" className="btn btn-primary">Log your first application</Link>
                </>
              ) : (
                <p>No applications match your filters. <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setStageFilter('All'); }}>Clear filters</button></p>
              )}
            </motion.div>
          ) : (
            <motion.div variants={container} initial="hidden" animate="show" className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="data-table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Role</th>
                    <th>Stage</th>
                    <th>Date</th>
                    <th>Notes</th>
                    <th style={{ width: '100px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filtered.map((app) => (
                      <motion.tr
                        key={app.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{ cursor: 'pointer', position: 'relative' }}
                      >
                        <td style={{ fontWeight: '500' }}>{app.company}</td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{app.role}</td>
                        <td>
                          {/* Stage badge — click to edit */}
                          <div style={{ position: 'relative', display: 'inline-block' }}>
                            <button
                              className={`badge ${stageColors[app.stage] || 'badge-slate'}`}
                              onClick={e => { e.stopPropagation(); setEditingStage(editingStage === app.id ? null : app.id); }}
                              style={{ cursor: 'pointer', border: 'none', fontSize: '11px' }}
                              title="Click to change stage"
                            >
                              {app.stage}
                            </button>
                            <AnimatePresence>
                              {editingStage === app.id && (
                                <motion.div
                                  initial={{ opacity: 0, y: -6, scale: 0.95 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.95 }}
                                  style={{
                                    position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 200,
                                    background: 'var(--bg-card)', border: 'var(--border)', borderRadius: 'var(--radius-sm)',
                                    boxShadow: 'var(--shadow-lg)', minWidth: '160px', padding: '6px',
                                  }}
                                >
                                  {STAGES.map(s => (
                                    <button
                                      key={s}
                                      onClick={e => { e.stopPropagation(); changeStage(app.id, s); }}
                                      style={{
                                        display: 'block', width: '100%', textAlign: 'left',
                                        padding: '7px 10px', fontSize: '13px', background: s === app.stage ? 'var(--accent-pale)' : 'none',
                                        border: 'none', borderRadius: '6px', cursor: 'pointer',
                                        color: s === app.stage ? 'var(--accent)' : 'var(--text-primary)',
                                        fontWeight: s === app.stage ? '500' : '400',
                                      }}
                                      onMouseEnter={e => { if (s !== app.stage) e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                                      onMouseLeave={e => { if (s !== app.stage) e.currentTarget.style.background = 'none'; }}
                                    >
                                      {s}
                                    </button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '13px', whiteSpace: 'nowrap' }}>
                          {app.date ? new Date(app.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '12px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {app.notes || '—'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            {deleteConfirm === app.id ? (
                              <>
                                <button
                                  className="btn btn-danger btn-sm"
                                  style={{ fontSize: '11px', padding: '4px 8px' }}
                                  onClick={e => { e.stopPropagation(); handleDelete(app.id); }}
                                >
                                  Confirm
                                </button>
                                <button
                                  className="btn btn-ghost btn-sm"
                                  style={{ fontSize: '11px', padding: '4px 8px' }}
                                  onClick={e => { e.stopPropagation(); setDeleteConfirm(null); }}
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  className="btn btn-ghost btn-sm"
                                  style={{ padding: '5px', color: 'var(--danger)', opacity: 0.7 }}
                                  title="Delete"
                                  onClick={e => { e.stopPropagation(); setDeleteConfirm(app.id); }}
                                >
                                  <Trash2 size={13} />
                                </button>
                                <Link
                                  href={`/applications/${app.id}`}
                                  className="btn btn-ghost btn-sm"
                                  style={{ padding: '5px 8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '3px' }}
                                  onClick={e => e.stopPropagation()}
                                >
                                  View <ChevronRight size={12} />
                                </Link>
                              </>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </motion.div>
          )}
        </div>
      </main>
      {/* Close dropdown on outside click */}
      {editingStage && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 100 }}
          onClick={() => setEditingStage(null)}
        />
      )}
    </div>
  );
}
