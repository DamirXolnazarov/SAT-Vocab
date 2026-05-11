import { Outlet, NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BottomNav } from './BottomNav'
import { useAuthStore } from '../../stores/authStore'

// ─── Sidebar (desktop only) ───────────────────────────────────────────────────

const SIDEBAR_ITEMS = [
  { to: '/',        label: 'Home',    emoji: '🏠' },
  { to: '/learn',   label: 'Learn',   emoji: '📖' },
  { to: '/stats',   label: 'Stats',   emoji: '📊' },
  { to: '/compete', label: 'Compete', emoji: '🏆' },
  { to: '/profile', label: 'Profile', emoji: '👤' },
]

function Sidebar() {
  const { profile } = useAuthStore()

  return (
    <aside style={{
      width: 'var(--sidebar-width)',
      minHeight: '100vh',
      position: 'fixed', top: 0, left: 0, bottom: 0,
      background: 'var(--c-bg)',
      borderRight: '1px solid var(--c-border)',
      display: 'flex', flexDirection: 'column',
      zIndex: 40,
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--c-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36,
            background: 'var(--c-primary)',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <span style={{ color: '#fff', fontWeight: 900, fontSize: 16 }}>V</span>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--c-text)', lineHeight: 1 }}>Vocabook</div>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {SIDEBAR_ITEMS.map(({ to, label, emoji }) => (
          <NavLink key={to} to={to} end={to === '/'} style={{ textDecoration: 'none' }}>
            {({ isActive }) => (
              <motion.div
                whileHover={{ x: 2 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', borderRadius: 'var(--r-sm)',
                  cursor: 'pointer', transition: 'background 0.15s ease',
                  background: isActive ? 'var(--c-primary-pale)' : 'transparent',
                }}
              >
                <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{emoji}</span>
                <span style={{
                  fontSize: 14, fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'var(--c-primary)' : 'var(--c-text-muted)',
                }}>
                  {label}
                </span>
                {isActive && (
                  <div style={{
                    marginLeft: 'auto', width: 6, height: 6,
                    borderRadius: '50%', background: 'var(--c-primary)',
                  }} />
                )}
              </motion.div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Profile summary */}
      {profile && (
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--c-border)' }}>
          <div style={{
            background: 'var(--c-primary-pale)',
            borderRadius: 'var(--r-sm)',
            padding: '10px 12px',
          }}>
            <div style={{ fontSize: 11, color: 'var(--c-primary)', fontWeight: 600, marginBottom: 2 }}>
              {profile.level || 'Beginner'}
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--c-primary)' }}>
              ⚡ {profile.total_xp || 0} XP
            </div>
            {profile.current_streak > 0 && (
              <div style={{ fontSize: 12, color: 'var(--c-gold)', marginTop: 2, fontWeight: 500 }}>
                🔥 {profile.current_streak} day streak
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  )
}

// ─── AppLayout ────────────────────────────────────────────────────────────────

export function AppLayout() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--c-bg-off)' }}>

      {/* Desktop sidebar */}
      <div style={{ display: 'none' }} className="md-sidebar">
        <Sidebar />
      </div>

      {/* Main content area */}
     <main style={{
  paddingBottom: 'calc(var(--nav-height) + 24px)',
  minHeight: '100vh',
}}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 16px' }}>
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <BottomNav />

      {/* Desktop sidebar via CSS */}
      <style>{`
        @media (min-width: 768px) {
          .md-sidebar { display: block !important; }
          main {
            margin-left: var(--sidebar-width) !important;
            padding-bottom: 0 !important;
          }
        }
      `}</style>
    </div>
  )
}