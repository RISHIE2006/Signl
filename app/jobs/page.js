'use client';
import { useState, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import Sidebar from '@/components/Sidebar';
import ResumeManager from '@/components/ResumeManager';
import {
  Search, Briefcase, MapPin, Clock, DollarSign, Sparkles,
  ExternalLink, AlertCircle, FileUp, FileText, X, Zap,
  Filter, ChevronDown, Star, TrendingUp, Building2, Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PLATFORM_COLORS = {
  LinkedIn: '#0A66C2',
  Indeed: '#2164F3',
  Glassdoor: '#0CAA41',
  Wellfound: '#F05330',
  Internshala: '#008BBA',
  Naukri: '#FF7555',
  Greenhouse: '#3C4E5C',
};

const PLATFORM_ICONS = {
  LinkedIn: '🔗',
  Indeed: '🔍',
  Glassdoor: '🪟',
  Wellfound: '🚀',
  Internshala: '🎓',
  Naukri: '💼',
  Greenhouse: '🌿',
};

const TYPE_OPTIONS = ['Any', 'Full-time', 'Internship', 'Contract', 'Part-time'];
const EXPERIENCE_OPTIONS = ['Any', 'Entry Level', 'Mid Level', 'Senior Level'];

function ScoreBadge({ score }) {
  const color = score >= 75 ? 'var(--success)' : score >= 55 ? 'var(--accent)' : 'var(--text-muted)';
  const bgColor = score >= 75 ? 'var(--success-light)' : score >= 55 ? 'var(--accent-pale)' : 'var(--bg-secondary)';
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      background: bgColor, color, border: `1px solid ${color}`,
      borderRadius: '6px', padding: '4px 10px', fontSize: '12px', fontWeight: '700',
    }}>
      <Sparkles size={11} />
      {score}% Match
    </div>
  );
}

function JobCard({ job, index }) {
  const [expanded, setExpanded] = useState(false);
  const platformColor = PLATFORM_COLORS[job.platform] || 'var(--accent)';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      style={{
        background: 'var(--bg-card)',
        border: job.isHot ? `1px solid ${platformColor}33` : 'var(--border)',
        borderRadius: 'var(--radius)',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'box-shadow 0.2s, transform 0.2s',
      }}
      whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}
    >
      {/* Hot indicator */}
      {job.isHot && (
        <div style={{
          position: 'absolute', top: 0, right: 0,
          background: platformColor, color: '#fff',
          fontSize: '9px', fontWeight: '800', textTransform: 'uppercase',
          letterSpacing: '0.06em', padding: '3px 10px',
          borderBottomLeftRadius: '8px',
        }}>
          🔥 Strong Match
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px', gap: '12px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '3px' }}>
            {job.title}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            <Building2 size={12} />
            {job.company}
          </div>
        </div>
        <ScoreBadge score={job.matchScore} />
      </div>

      {/* Meta row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
        {[
          { icon: MapPin, text: job.location },
          { icon: Briefcase, text: job.type },
          { icon: DollarSign, text: job.salary },
          { icon: Clock, text: job.postedAgo },
        ].map(({ icon: Icon, text }) => (
          <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
            <Icon size={11} />
            {text}
          </div>
        ))}
      </div>

      {/* Tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
        {job.tags?.map(tag => (
          <span key={tag} style={{
            background: 'var(--bg-secondary)', color: 'var(--text-secondary)',
            border: 'var(--border)', borderRadius: '4px',
            fontSize: '11px', padding: '3px 8px', fontWeight: '500'
          }}>
            {tag}
          </span>
        ))}
      </div>

      {/* Match reason */}
      <div style={{
        background: 'var(--bg-secondary)', borderRadius: '8px',
        padding: '10px 12px', marginBottom: '12px',
        fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5'
      }}>
        <span style={{ color: 'var(--accent)', fontWeight: '600' }}>Why it matches: </span>
        {job.matchReason}
      </div>

      {/* Expand toggle */}
      <button
        onClick={() => setExpanded(v => !v)}
        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', marginBottom: '10px', padding: '2px 0' }}
      >
        <ChevronDown size={12} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        {expanded ? 'Hide details' : 'See more details'}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden', marginBottom: '12px' }}
          >
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '12px' }}>
              {job.description}
            </p>
            {job.missingSkills?.length > 0 && (
              <div>
                <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--danger)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                  Skills to strengthen
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {job.missingSkills.map(s => (
                    <span key={s} style={{
                      background: 'var(--danger-light)', color: 'var(--danger)',
                      borderRadius: '4px', fontSize: '11px', padding: '3px 8px', fontWeight: '500'
                    }}>{s}</span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: 'var(--border-soft)', paddingTop: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px' }}>
          <span>{PLATFORM_ICONS[job.platform] || '🔗'}</span>
          <span style={{ color: platformColor, fontWeight: '600' }}>{job.platform}</span>
        </div>
        <a
          href={job.applyUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            background: platformColor, color: '#fff',
            borderRadius: '8px', fontSize: '12px', fontWeight: '600',
            padding: '7px 14px', textDecoration: 'none',
            transition: 'opacity 0.15s'
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          Apply Now <ExternalLink size={11} />
        </a>
      </div>
    </motion.div>
  );
}

export default function JobsPage() {
  const { user } = useUser();
  const [step, setStep] = useState('upload'); // 'upload' | 'results'
  const [resumeData, setResumeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ location: '', type: 'Any', experience: 'Any' });
  const [activeTypeFilter, setActiveTypeFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [jobQuery, setJobQuery] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);


  const extractAndSearch = async () => {
    if (!resumeData?.text) return;
    
    setLoading(true);
    setError('');
    setJobs([]); // Reset for new search
    try {
      const textToUse = resumeData.text;

      if (!textToUse || textToUse.trim().length < 50) {
        throw new Error('Your resume text is too short. Please update your resume in Settings or re-upload a valid file.');
      }

      const res = await fetch('/api/jobs/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: textToUse, filters, jobQuery }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Search failed.');
      }

      const data = await res.json();
      if (!data.jobs?.length) throw new Error('No jobs returned. Please try again.');

      setJobs(data.jobs);
      setStep('results');
    } catch (err) {
      setError(err.message || 'Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!resumeData?.text || loadingMore) return;
    
    setLoadingMore(true);
    try {
      const excludeTitles = jobs.map(j => j.title).slice(0, 50); // Send some existing titles
      
      const res = await fetch('/api/jobs/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          resumeText: resumeData.text, 
          filters, 
          jobQuery,
          excludeTitles 
        }),
      });
      
      if (!res.ok) throw new Error('Failed to load more jobs.');
      
      const data = await res.json();
      if (data.jobs?.length) {
        // Filter out any accidental exact duplicates and append
        const newJobs = data.jobs.filter(newJob => !jobs.some(oldJob => oldJob.title === newJob.title && oldJob.company === newJob.company));
        setJobs(prev => [...prev, ...newJobs]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  };

  const allTypes = ['All', ...new Set(jobs.map(j => j.type))];
  const displayed = jobs.filter(j => {
    const typeOk = activeTypeFilter === 'All' || j.type === activeTypeFilter;
    const searchOk = !search || j.title.toLowerCase().includes(search.toLowerCase()) || j.company.toLowerCase().includes(search.toLowerCase()) || j.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()));
    return typeOk && searchOk;
  });

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
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <div style={{ background: 'var(--accent)', borderRadius: '10px', padding: '8px', display: 'flex' }}>
                <Search size={16} color="var(--bg)" />
              </div>
              <h1 className="page-title">Job Matcher</h1>
            </div>
            <p className="page-subtitle">
              Upload your resume and let AI find the best matching jobs &amp; internships from LinkedIn, Indeed, Glassdoor, Wellfound &amp; more.
            </p>
          </motion.div>

          <AnimatePresence mode="wait">
            {step === 'upload' ? (
              /* ── UPLOAD STEP ── */
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.35 }}
              >
                <div style={{
                  maxWidth: '680px', margin: '0 auto',
                  background: 'var(--bg-card)', border: 'var(--border)',
                  borderRadius: 'var(--radius)', padding: '40px',
                }}>
                  {/* Job Search Goal */}
                  <div style={{ marginBottom: '24px' }}>
                    <label className="form-label" style={{ marginBottom: '10px', display: 'block' }}>
                      What type of job are you looking for?
                    </label>
                    <input
                      className="input"
                      type="text"
                      placeholder="e.g. Frontend Engineer at a Fintech startup, Product Intern in Europe..."
                      value={jobQuery}
                      onChange={e => setJobQuery(e.target.value)}
                      style={{ fontSize: '14px', padding: '12px 14px' }}
                    />
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                      We'll use this along with your resume to find the best matches.
                    </p>
                  </div>

                  {/* Centralized Resume Manager */}
                  <div style={{ marginBottom: '24px' }}>
                    <label className="form-label" style={{ marginBottom: '10px', display: 'block' }}>Your Resume</label>
                    <ResumeManager onUpdate={setResumeData} />
                  </div>

                  {/* Filters */}
                  <div style={{ borderTop: 'var(--border-soft)', paddingTop: '20px', marginTop: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                      <Filter size={13} /> Search Filters <span style={{ fontSize: '11px', fontWeight: '400', color: 'var(--text-muted)' }}>(optional)</span>
                    </div>
                    <div className="grid-3" style={{ gap: '12px' }}>
                      <div>
                        <label className="form-label">Location</label>
                        <input
                          className="input"
                          type="text"
                          placeholder="e.g. London, Remote"
                          value={filters.location}
                          onChange={e => setFilters(f => ({ ...f, location: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="form-label">Job Type</label>
                        <select className="select" value={filters.type} onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}>
                          {TYPE_OPTIONS.map(o => <option key={o}>{o}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="form-label">Experience</label>
                        <select className="select" value={filters.experience} onChange={e => setFilters(f => ({ ...f, experience: e.target.value }))}>
                          {EXPERIENCE_OPTIONS.map(o => <option key={o}>{o}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)', background: 'var(--danger-light)', border: '1px solid var(--danger)', borderRadius: 'var(--radius)', padding: '12px 14px', fontSize: '13px', marginTop: '16px' }}
                    >
                      <AlertCircle size={14} /> {error}
                    </motion.div>
                  )}

                  <button
                    id="find-jobs-btn"
                    className="btn btn-primary"
                    onClick={extractAndSearch}
                    disabled={loading || !resumeData?.text}
                    style={{
                      width: '100%', justifyContent: 'center', marginTop: '24px',
                      padding: '13px', fontSize: '14px',
                      opacity: (loading || !resumeData?.text) ? 0.4 : 1
                    }}
                  >
                    {loading ? (
                      <>
                        <div className="loading-spinner" style={{ width: '16px', height: '16px', borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }} />
                        Scanning 500+ job boards...
                      </>
                    ) : (
                      <><Zap size={15} /> Find My Best Matches</>
                    )}
                  </button>

                  {loading && (
                    <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', marginTop: '10px' }}>
                      Analysing resume → Searching LinkedIn, Indeed, Glassdoor, Wellfound &amp; more...
                    </p>
                  )}
                </div>
              </motion.div>
            ) : (
              /* ── RESULTS STEP ── */
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                {/* Results top bar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '2px' }}>
                      {displayed.length} Jobs Found
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      Sorted by AI match score
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* Search filter */}
                    <div style={{ position: 'relative' }}>
                      <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input
                        className="input"
                        type="text"
                        placeholder="Search roles, companies..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ paddingLeft: '30px', width: '220px', padding: '8px 12px 8px 30px' }}
                      />
                    </div>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => { setStep('upload'); setJobs([]); setSearch(''); setActiveTypeFilter('All'); }}
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      <FileUp size={13} /> New Search
                    </button>
                  </div>
                </div>

                {/* Type filter chips */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
                  {allTypes.map(type => (
                    <button
                      key={type}
                      className={`chip ${activeTypeFilter === type ? 'active' : ''}`}
                      onClick={() => setActiveTypeFilter(type)}
                    >
                      {type}
                      {type !== 'All' && (
                        <span style={{ marginLeft: '4px', opacity: 0.6 }}>
                          ({jobs.filter(j => j.type === type).length})
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Stats row */}
                <div className="grid-3" style={{ gap: '12px', marginBottom: '28px' }}>
                  {[
                    { label: 'Avg Match Score', value: `${Math.round(jobs.reduce((a, j) => a + j.matchScore, 0) / jobs.length)}%`, icon: TrendingUp },
                    { label: 'Hot Matches (75%+)', value: jobs.filter(j => j.isHot).length, icon: Star },
                    { label: 'Platforms Searched', value: new Set(jobs.map(j => j.platform)).size, icon: Globe },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="card card-sm" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ background: 'var(--accent-pale)', borderRadius: '8px', padding: '8px', display: 'flex' }}>
                        <Icon size={16} color="var(--accent)" />
                      </div>
                      <div>
                        <div style={{ fontSize: '18px', fontWeight: '700', letterSpacing: '-0.02em' }}>{value}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Job cards grid */}
                {displayed.length > 0 ? (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                      {displayed.map((job, i) => (
                        <JobCard key={job.id || `${job.title}-${job.company}-${i}`} job={job} index={i} />
                      ))}
                    </div>

                    {/* Load More Button */}
                    {jobs.length > 0 && jobs.length < 120 && (
                      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
                        <button
                          className="btn btn-ghost"
                          onClick={loadMore}
                          disabled={loadingMore}
                          style={{ border: '1px solid var(--border)', padding: '10px 30px', fontSize: '13px' }}
                        >
                          {loadingMore ? (
                            <><div className="loading-spinner" style={{ width: '14px', height: '14px', marginRight: '8px' }} /> Finding more unique results...</>
                          ) : (
                            <><Sparkles size={14} style={{ marginRight: '6px' }} /> Show More Matches</>
                          )}
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="empty-state">
                    <Search size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                    <h3>No jobs match your filter</h3>
                    <p>Try clearing the search or changing the type filter.</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
