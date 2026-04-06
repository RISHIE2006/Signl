'use client';
import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import Sidebar from '@/components/Sidebar';
import ResumeManager from '@/components/ResumeManager';
import { clearAllData } from '@/lib/store';
import { UserCircle, Lock, Database, Bell, FileText } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'account', label: 'Account', icon: UserCircle },
  { id: 'resume', label: 'Resume', icon: FileText },
  { id: 'privacy', label: 'Privacy', icon: Lock },
  { id: 'data', label: 'Data', icon: Database },
  { id: 'notifications', label: 'Notifications', icon: Bell },
];

function Toggle({ checked, onChange }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="toggle-slider" />
    </label>
  );
}

export default function SettingsPage() {
  const { user } = useUser();
  const [activeSection, setActiveSection] = useState('account');
  const [prefs, setPrefs] = useState({ shareData: true, emailNotifs: false, weeklyReport: true });
  const [cleared, setCleared] = useState(false);

  const togglePref = (key) => setPrefs(prev => ({ ...prev, [key]: !prev[key] }));

  const handleClear = () => {
    if (!user) return;
    if (window.confirm('This will permanently delete all your logged applications and analyses. Are you sure?')) {
      clearAllData(user.id);
      setCleared(true);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="settings-layout">
          {/* Settings secondary nav */}
          <div className="settings-nav">
            <div style={{ padding: '0 0 24px 24px', fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Settings</div>
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                className={`settings-nav-item ${activeSection === id ? 'active' : ''}`}
                onClick={() => setActiveSection(id)}
              >
                <Icon size={14} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                {label}
              </button>
            ))}
          </div>

          {/* Settings content */}
          <div className="settings-main">

            {activeSection === 'account' && (
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '32px' }}>Account</h2>
                <div className="card" style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                    {user?.imageUrl && <img src={user.imageUrl} alt="Profile" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />}
                    <div>
                      <div style={{ fontWeight: '600' }}>{user?.fullName || 'Unknown'}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{user?.primaryEmailAddress?.emailAddress}</div>
                    </div>
                  </div>
                  <hr className="divider" style={{ margin: '0 0 16px' }} />
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <a href="https://accounts.clerk.dev" target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">Manage Account</a>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'resume' && (
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Resume Management</h2>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '28px' }}>This resume will be used as your primary context for all simulations and analyses.</p>
                <ResumeManager />
              </div>
            )}

            {activeSection === 'privacy' && (
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Privacy</h2>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '28px' }}>Control how your data is used to improve market benchmarks.</p>
                <div className="card">
                  <div className="toggle-row">
                    <div className="toggle-info">
                      <h4>Share Anonymised Data</h4>
                      <p>Contribute your rejection patterns (anonymised) to market benchmark data. No personal information is shared.</p>
                    </div>
                    <Toggle checked={prefs.shareData} onChange={() => togglePref('shareData')} />
                  </div>
                  <div className="toggle-row">
                    <div className="toggle-info">
                      <h4>Analytics Tracking</h4>
                      <p>Allow basic usage analytics to improve the product.</p>
                    </div>
                    <Toggle checked={true} onChange={() => {}} />
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'data' && (
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Data Management</h2>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '28px' }}>Your data is stored locally in your browser.</p>
                <div className="card" style={{ marginBottom: '16px' }}>
                  <div style={{ fontWeight: '500', marginBottom: '6px' }}>Export Data</div>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>Download all your application data as JSON.</p>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      const data = {
                        profile: JSON.parse(localStorage.getItem(`signl_${user?.id}_profile`) || 'null'),
                        applications: JSON.parse(localStorage.getItem(`signl_${user?.id}_applications`) || '[]'),
                        analyses: JSON.parse(localStorage.getItem(`signl_${user?.id}_analyses`) || '[]'),
                      };
                      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url; a.download = 'signl-data.json'; a.click();
                    }}
                  >
                    Export as JSON
                  </button>
                </div>

                <div className="card" style={{ borderColor: 'var(--danger)' }}>
                  <div style={{ fontWeight: '500', marginBottom: '6px', color: 'var(--danger)' }}>Danger Zone</div>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    This will permanently delete all your logged applications, analyses, and profile data from this browser.
                  </p>
                  {cleared ? (
                    <div style={{ color: 'var(--success)', fontSize: '13px' }}>✓ All data cleared.</div>
                  ) : (
                    <button className="btn btn-danger btn-sm" onClick={handleClear}>Clear All My Data</button>
                  )}
                </div>
              </div>
            )}

            {activeSection === 'notifications' && (
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Notifications</h2>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '28px' }}>Manage your notification preferences.</p>
                <div className="card">
                  <div className="toggle-row">
                    <div className="toggle-info">
                      <h4>Email Notifications</h4>
                      <p>Get notified when we have new insights for you.</p>
                    </div>
                    <Toggle checked={prefs.emailNotifs} onChange={() => togglePref('emailNotifs')} />
                  </div>
                  <div className="toggle-row">
                    <div className="toggle-info">
                      <h4>Weekly Report</h4>
                      <p>Receive a weekly summary of your application activity.</p>
                    </div>
                    <Toggle checked={prefs.weeklyReport} onChange={() => togglePref('weeklyReport')} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
