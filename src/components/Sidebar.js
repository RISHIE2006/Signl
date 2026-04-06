'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { 
  LayoutDashboard, FilePlus, ScanSearch, BarChart2, 
  Settings, CreditCard, Signal, ListChecks, BrainCircuit, 
  Mail, MessageSquare, Zap, ChevronRight, Search, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from './ThemeToggle';

const groups = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', color: 'var(--accent)' }
    ]
  },
  {
    label: 'Applications',
    items: [
      { href: '/log',          icon: FilePlus,        label: 'Log New',      color: '#34D399' },
      { href: '/applications', icon: ListChecks,       label: 'My Pipeline',  color: '#60A5FA' },
      { href: '/analyse',      icon: ScanSearch,       label: 'Resume Check', color: '#A78BFA' },
      { href: '/jobs',         icon: Search,           label: 'Job Matcher',  color: '#FBBF24' }
    ]
  },
  {
    label: 'AI Prep',
    items: [
      { href: '/prep-voice',   icon: Zap,             label: 'Voice Coach',   color: '#FB923C' },
      { href: '/prep',         icon: BrainCircuit,    label: 'Interview Lab', color: '#F472B6' },
      { href: '/simulation',   icon: MessageSquare,   label: 'Live Sandbox',  color: '#38BDF8' },
      { href: '/simulation/pipeline', icon: Signal,   label: 'Full Pipeline', color: '#818CF8' },
      { href: '/cover-letter', icon: Mail,            label: 'Cover Letter',  color: '#94A3B8' }
    ]
  },
  {
    label: 'Growth',
    items: [
      { href: '/dna',        icon: Activity,  label: 'Comm. DNA',   color: '#10B981' },
      { href: '/benchmarks', icon: BarChart2, label: 'Market Data', color: '#F87171' }
    ]
  },
  {
    label: 'System',
    items: [
      { href: '/settings', icon: Settings,    label: 'Preferences', color: '#64748B' },
      { href: '/billing',  icon: CreditCard,  label: 'Billing',     color: '#0D9488' }
    ]
  }
];

export default function Sidebar() {
  const path = usePathname();

  return (
    <aside style={{
      position: 'fixed', top: 0, left: 0, bottom: 0,
      width: 'var(--sidebar-w)',
      background: 'var(--glass)',
      backdropFilter: 'blur(24px) saturate(1.6)',
      WebkitBackdropFilter: 'blur(24px) saturate(1.6)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100,
    }}>

      {/* Brand Header */}
      <Link href="/" style={{
        padding: '24px 20px',
        display: 'flex', alignItems: 'center', gap: '12px',
        textDecoration: 'none', color: 'inherit',
        position: 'relative', zIndex: 1,
      }}>
        <motion.div
          whileHover={{ scale: 1.12, rotate: 8 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          style={{
            background: 'linear-gradient(135deg, var(--accent-light) 0%, var(--accent) 100%)',
            width: '36px', height: '36px',
            borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff',
          }}
        >
          <Signal size={18} strokeWidth={3} color="#fff" />
        </motion.div>
        <div>
          <div style={{
            fontSize: '18px', fontWeight: '800', letterSpacing: '-0.03em',
            color: 'var(--text-primary)',
          }}>Signl</div>
          <div style={{
            fontSize: '8px', color: 'var(--text-muted)', fontWeight: '700',
            textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap'
          }}>Turn rejections into data</div>
        </div>
      </Link>

      {/* Nav Groups */}
      <nav style={{
        flex: 1, padding: '0 12px 20px',
        display: 'flex', flexDirection: 'column', gap: '28px',
        overflowY: 'auto', position: 'relative', zIndex: 1,
      }}>
        {groups.map((group) => (
          <div key={group.label}>
            <h4 style={{
              fontSize: '9.5px', fontWeight: '800',
              textTransform: 'uppercase', letterSpacing: '0.12em',
              color: 'var(--text-muted)',
              marginBottom: '8px', paddingLeft: '12px', opacity: 0.7
            }}>
              {group.label}
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {group.items.map(({ href, icon: Icon, label, color }) => {
                const isPipelineRoute = path.startsWith('/simulation/pipeline');
                const active = path === href || (path.startsWith(href + '/') && !(href === '/simulation' && isPipelineRoute));
                return (
                  <Link key={href} href={href} style={{ textDecoration: 'none' }}>
                    <motion.div
                      whileHover={{ x: 3 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '9px 12px',
                        borderRadius: '10px',
                        fontSize: '13.5px',
                        color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontWeight: active ? '600' : '400',
                        background: active
                          ? 'var(--accent-pale)'
                          : 'transparent',
                        border: '1px solid transparent',
                        position: 'relative',
                        transition: 'color 0.2s, background 0.2s, box-shadow 0.2s',
                      }}
                    >
                      {/* Active left pill */}
                      {active && (
                        <motion.div
                          layoutId="active-pill"
                          style={{
                            position: 'absolute', left: '-1px',
                            width: '3px', height: '18px',
                            background: color || 'var(--accent)',
                            borderRadius: '100px',
                          }}
                          transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                        />
                      )}

                      <motion.div
                        style={{
                          color: color || 'var(--accent)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Icon size={16} strokeWidth={2.2} />
                      </motion.div>

                      <span style={{ flex: 1 }}>{label}</span>

                      <AnimatePresence>
                        {active && (
                          <motion.div
                            initial={{ opacity: 0, x: -4 }}
                            animate={{ opacity: 0.4, x: 0 }}
                            exit={{ opacity: 0, x: -4 }}
                          >
                            <ChevronRight size={12} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Footer */}
      <footer style={{
        padding: '16px 20px',
        borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'relative', zIndex: 1,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ transform: 'scale(0.85)', transformOrigin: 'left' }}>
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
          <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
            Account
          </div>
        </div>
        <ThemeToggle />
      </footer>
    </aside>
  );
}
