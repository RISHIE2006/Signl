'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { saveProfile } from '@/lib/store';
import { Briefcase, GraduationCap, ChevronRight, Check } from 'lucide-react';

const SUGGESTED_ROLES = [
  'Software Engineer', 'Product Manager', 'Data Analyst', 'UX Designer',
  'Frontend Engineer', 'Backend Engineer', 'Data Scientist', 'DevOps Engineer',
  'Marketing Manager', 'Business Analyst',
];

export default function OnboardingPage() {
  const { user } = useUser();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState('');
  const [roleInput, setRoleInput] = useState('');
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [saving, setSaving] = useState(false);

  const toggleRole = (role) => {
    setSelectedRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const addCustomRole = () => {
    const trimmed = roleInput.trim();
    if (trimmed && !selectedRoles.includes(trimmed)) {
      setSelectedRoles(prev => [...prev, trimmed]);
      setRoleInput('');
    }
  };

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);
    saveProfile(user.id, { status, targetRoles: selectedRoles });
    router.push('/dashboard');
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 20px',
    }}>
      <div style={{ width: '100%', maxWidth: '560px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ fontSize: '18px', fontWeight: '700', letterSpacing: '-0.02em' }}>Signl</div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Let&rsquo;s set up your profile</div>
        </div>

        {/* Progress */}
        <div className="step-indicator">
          {[1, 2].map(s => (
            <div key={s} className={`step-dot ${step === s ? 'active' : step > s ? 'done' : ''}`} />
          ))}
        </div>

        {/* Step 1: Experience */}
        {step === 1 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <div style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '12px' }}>Step 1 of 2</div>
              <h1 style={{ fontSize: '24px', fontWeight: '600', letterSpacing: '-0.02em' }}>Tell us about your journey</h1>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '8px' }}>This helps us tailor insights for where you are right now.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
              {[
                { value: 'fresher', icon: GraduationCap, label: 'Fresher', desc: 'Recently graduated or entering the workforce' },
                { value: 'professional', icon: Briefcase, label: 'Professional', desc: 'Currently working or have significant experience' },
              ].map(({ value, icon: Icon, label, desc }) => (
                <button
                  key={value}
                  onClick={() => setStatus(value)}
                  style={{
                    padding: '28px 20px',
                    border: status === value ? '1px solid var(--accent)' : 'var(--border)',
                    borderRadius: 'var(--radius)',
                    background: status === value ? 'var(--accent-pale)' : 'var(--bg)',
                    textAlign: 'left', cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <Icon size={20} color={status === value ? 'var(--accent)' : 'var(--text-secondary)'} />
                  <div style={{ fontSize: '15px', fontWeight: '600', marginTop: '12px', color: status === value ? 'var(--accent)' : 'var(--text-primary)' }}>{label}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '1.5' }}>{desc}</div>
                </button>
              ))}
            </div>
            <button
              className="btn btn-primary btn-full"
              disabled={!status}
              onClick={() => setStep(2)}
              style={{ opacity: !status ? 0.4 : 1 }}
            >
              Continue <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Step 2: Target Roles */}
        {step === 2 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <div style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '12px' }}>Step 2 of 2</div>
              <h1 style={{ fontSize: '24px', fontWeight: '600', letterSpacing: '-0.02em' }}>What are you aiming for?</h1>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '8px' }}>Select all the roles you&rsquo;re applying for.</p>
            </div>

            {/* Custom input */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <input
                className="input"
                value={roleInput}
                onChange={e => setRoleInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCustomRole()}
                placeholder="Type a custom role and press Enter"
              />
              <button className="btn btn-ghost btn-sm" onClick={addCustomRole}>Add</button>
            </div>

            {/* Suggestions */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>Suggestions</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {SUGGESTED_ROLES.map(role => (
                  <button
                    key={role}
                    className={`chip ${selectedRoles.includes(role) ? 'active' : ''}`}
                    onClick={() => toggleRole(role)}
                  >
                    {selectedRoles.includes(role) && <Check size={11} />}
                    {role}
                  </button>
                ))}
              </div>
            </div>

            {selectedRoles.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>Selected ({selectedRoles.length})</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {selectedRoles.map(role => (
                    <span key={role} className="chip active" onClick={() => toggleRole(role)} style={{ cursor: 'pointer' }}>
                      {role} &times;
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-ghost" onClick={() => setStep(1)} style={{ flex: 0.6 }}>Back</button>
              <button
                className="btn btn-primary"
                onClick={handleFinish}
                disabled={saving || selectedRoles.length === 0}
                style={{ flex: 1, opacity: (saving || selectedRoles.length === 0) ? 0.4 : 1 }}
              >
                {saving ? 'Saving...' : 'Get Started'} {!saving && <ChevronRight size={16} />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
