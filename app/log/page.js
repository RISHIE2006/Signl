'use client';
import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { addApplication } from '@/lib/store';
import CompanyAutocomplete from '@/components/CompanyAutocomplete';
import { CalendarDays, Building2, Briefcase, Link as LinkIcon, FileText, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useBilling } from '@/hooks/useBilling';

const STAGES = ['Resume', 'HR Screen', 'Technical', 'Final Round', 'Offer'];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

export default function LogApplicationPage() {
  const { user } = useUser();
  const router = useRouter();
  const { canAddApplication, limits } = useBilling();
  const [form, setForm] = useState({
    company: '', role: '', stage: 'Resume', date: new Date().toISOString().split('T')[0],
    link: '', notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handle = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!user || !form.company || !form.role) return;
    setSaving(true);
    addApplication(user.id, form);
    setSaved(true);
    setTimeout(() => {
      setSaving(false);
      router.push('/dashboard');
    }, 800);
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-container" style={{ maxWidth: '700px' }}>
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="page-header">
            <h1 className="page-title">Log New Application</h1>
            <p className="page-subtitle">Keep track of every role you apply for.</p>
          </motion.div>

          {!canAddApplication ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card" style={{ textAlign: 'center', padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg-secondary)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <Lock size={40} />
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>Free Limit Reached</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', maxWidth: '300px' }}>You have reached the free limit of {limits.appsLimit} applications. Upgrade to Pro to log unlimited applications.</p>
              <button className="btn btn-primary" onClick={() => router.push('/billing')} style={{ background: 'var(--accent)', borderColor: 'var(--accent)' }}>Upgrade to Pro</button>
            </motion.div>
          ) : (
            <motion.form variants={container} initial="hidden" animate="show" onSubmit={handleSubmit}>
            {/* Company + Role */}
            <motion.div variants={item} className="grid-2">
              <div className="form-group">
                <label className="form-label">
                  <Building2 size={13} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                  Company
                </label>
                <CompanyAutocomplete value={form.company} onChange={handle('company')} />
              </div>
              <div className="form-group">
                <label className="form-label">
                  <Briefcase size={13} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                  Job Role
                </label>
                <input className="input" value={form.role} onChange={handle('role')} placeholder="e.g. Software Engineer" required />
              </div>
            </motion.div>

            {/* Stage selection */}
            <motion.div variants={item} className="form-group">
              <label className="form-label">Application Stage</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                {STAGES.map(stage => (
                  <button
                    type="button"
                    key={stage}
                    className={`chip ${form.stage === stage ? 'active' : ''}`}
                    onClick={() => setForm(prev => ({ ...prev, stage }))}
                  >
                    {stage}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Date */}
            <motion.div variants={item} className="form-group">
              <label className="form-label">
                <CalendarDays size={13} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                Application Date
              </label>
              <input type="date" className="input" value={form.date} onChange={handle('date')} style={{ maxWidth: '260px' }} />
            </motion.div>

            {/* Link */}
            <motion.div variants={item} className="form-group">
              <label className="form-label">
                <LinkIcon size={13} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                Job Posting URL <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
              </label>
              <input className="input" type="url" value={form.link} onChange={handle('link')} placeholder="https://..." />
            </motion.div>

            {/* Notes */}
            <motion.div variants={item} className="form-group">
              <label className="form-label">
                <FileText size={13} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                Notes <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
              </label>
              <textarea className="textarea" value={form.notes} onChange={handle('notes')} placeholder="Any additional context, interview notes, etc." style={{ minHeight: '100px' }} />
            </motion.div>

            <motion.div variants={item} style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
              <button type="button" className="btn btn-ghost" onClick={() => router.push('/dashboard')}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving} style={{ flex: 1, justifyContent: 'center', opacity: saving ? 0.6 : 1 }}>
                {saved ? '✓ Saved!' : saving ? 'Saving...' : 'Log Application'}
              </button>
            </motion.div>
          </motion.form>
          )}
        </div>
      </main>
    </div>
  );
}
