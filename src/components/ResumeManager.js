'use client';
import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { getResume, saveResume } from '@/lib/store';
import { FileUp, FileText, X, CheckCircle, AlertCircle, Loader2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ResumeManager({ onUpdate, compact = false }) {
  const { user } = useUser();
  const [resume, setResume] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      const savedResume = getResume(user.id);
      setResume(savedResume);
      if (onUpdate) onUpdate(savedResume);
    }
  }, [user, onUpdate]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];

    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid PDF or Word Document (.docx, .doc).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be under 5MB.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/extract-text', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const resumeData = {
        text: data.text,
        fileName: file.name,
        fileSize: file.size,
      };

      saveResume(user.id, resumeData);
      setResume({ ...resumeData, updatedAt: new Date().toISOString() });
      if (onUpdate) onUpdate(resumeData);
    } catch (err) {
      console.error('Resume upload error:', err);
      setError(err.message || 'Failed to process resume.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeResume = () => {
    if (window.confirm('Are you sure you want to remove your saved resume?')) {
      saveResume(user.id, null);
      setResume(null);
      if (onUpdate) onUpdate(null);
    }
  };

  if (!user) return null;

  if (compact && resume) {
    return (
      <div className="flex items-center justify-between p-3 bg-secondary rounded-lg border border-soft">
        <div className="flex items-center gap-3">
          <FileText size={20} className="text-accent" />
          <div>
            <div className="text-sm font-medium truncate max-w-[200px]">{resume.fileName}</div>
            <div className="text-xs text-muted">Updated {new Date(resume.updatedAt).toLocaleDateString()}</div>
          </div>
        </div>
        <button onClick={() => fileInputRef.current?.click()} className="btn btn-ghost btn-sm p-1">
          <FileUp size={16} />
        </button>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf,.doc,.docx" style={{ display: 'none' }} />
      </div>
    );
  }

  return (
    <div className="resume-manager">
      <AnimatePresence mode="wait">
        {resume ? (
          <motion.div 
            key="has-resume"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="card"
            style={{ padding: '24px', border: '1px solid var(--success-light)', background: 'var(--bg-secondary)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--success-light)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '600' }}>Main Resume Active</h4>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>Using this across the platform</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  className="btn btn-ghost btn-sm"
                  title="Replace Resume"
                >
                  <FileUp size={14} />
                </button>
                <button 
                  onClick={removeResume}
                  className="btn btn-ghost btn-sm text-danger"
                  title="Remove Resume"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <div style={{ padding: '16px', background: 'var(--bg)', borderRadius: '8px', border: 'var(--border-soft)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FileText size={24} color="var(--accent)" />
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {resume.fileName}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {(resume.fileSize / 1024 / 1024).toFixed(2)} MB • Uploaded {new Date(resume.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="no-resume"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="upload-zone"
            onClick={() => !uploading && fileInputRef.current?.click()}
            style={{
              border: '2px dashed var(--border)',
              borderRadius: 'var(--radius)',
              padding: '40px 20px',
              textAlign: 'center',
              cursor: uploading ? 'default' : 'pointer',
              background: 'var(--bg)',
              transition: 'all 0.2s',
            }}
          >
            {uploading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <Loader2 size={32} className="animate-spin" color="var(--accent)" />
                <div style={{ fontSize: '14px', fontWeight: '500' }}>Extracting insights...</div>
              </div>
            ) : (
              <>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--bg-secondary)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <FileUp size={24} />
                </div>
                <h4 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: '600' }}>Upload your primary resume</h4>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>PDF or Word • Max 5MB</p>
                <div style={{ marginTop: '20px', fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <CheckCircle size={12} /> Used for match scoring, simulations, and outreach.
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept=".pdf,.doc,.docx" 
        style={{ display: 'none' }} 
      />

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginTop: '16px', padding: '12px', borderRadius: '8px', background: 'var(--danger-light)', color: 'var(--danger)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <AlertCircle size={16} /> {error}
        </motion.div>
      )}
    </div>
  );
}
