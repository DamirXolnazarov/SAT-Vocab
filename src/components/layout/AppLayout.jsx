import { Outlet, NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, BookOpen, BarChart2, Trophy, User, Zap, Flame } from 'lucide-react'
import { BottomNav } from './BottomNav'
import { useAuthStore } from '../../stores/authStore'
import { getLevel } from '../../stores/userStore'

// ─── Sidebar (desktop only) ───────────────────────────────────────────────────

const SIDEBAR_ITEMS = [
  { to: '/home',    label: 'Home',    Icon: Home      },
  { to: '/learn',   label: 'Learn',   Icon: BookOpen  },
  { to: '/stats',   label: 'Stats',   Icon: BarChart2 },
  { to: '/compete', label: 'Compete', Icon: Trophy    },
  { to: '/profile', label: 'Profile', Icon: User      },
]

function Sidebar() {
  const { profile } = useAuthStore()
  const xp          = profile?.total_xp || 0
  const streak      = profile?.current_streak || 0
  const level       = getLevel(xp)

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
      <div style={{
        padding: '18px 20px 16px',
        borderBottom: '1px solid var(--c-border)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          background: 'var(--c-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(139,26,46,0.25)',
          flexShrink: 0,
        }}>
          <span style={{
            color: '#fff', fontWeight: 900, fontSize: 17,
            fontFamily: 'Georgia, serif',
          }}>
            V
          </span>
        </div>
        <div>
          <div style={{
            fontWeight: 800, fontSize: 15,
            color: 'var(--c-text)', lineHeight: 1,
            fontFamily: 'Georgia, serif',
          }}>
            Vocabook
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav style={{
        flex: 1, padding: '12px 10px',
        display: 'flex', flexDirection: 'column', gap: 2,
      }}>
        {SIDEBAR_ITEMS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/home'}
            style={{ textDecoration: 'none' }}
          >
            {({ isActive }) => (
              <motion.div
                whileHover={{ x: 2 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', borderRadius: 'var(--r-sm)',
                  cursor: 'pointer',
                  background: isActive ? 'var(--c-primary-pale)' : 'transparent',
                  transition: 'background 0.15s ease',
                }}
              >
                <Icon
                  size={17}
                  color={isActive ? 'var(--c-primary)' : 'var(--c-text-muted)'}
                  strokeWidth={isActive ? 2.2 : 1.7}
                />
                <span style={{
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'var(--c-primary)' : 'var(--c-text-muted)',
                  transition: 'color 0.15s ease',
                }}>
                  {label}
                </span>
                {isActive && (
                  <div style={{
                    marginLeft: 'auto',
                    width: 6, height: 6, borderRadius: '50%',
                    background: 'var(--c-primary)',
                  }} />
                )}
              </motion.div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Profile summary */}
      {profile && (
        <div style={{ padding: '12px 14px', borderTop: '1px solid var(--c-border)' }}>
          <div style={{
            background: 'var(--c-primary-pale)',
            borderRadius: 'var(--r-sm)',
            padding: '12px 14px',
          }}>
            <div style={{
              fontSize: 11, fontWeight: 600,
              color: 'var(--c-primary)', marginBottom: 6,
            }}>
              {level.label}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: streak > 0 ? 6 : 0 }}>
              <Zap size={13} color="var(--c-gold)" fill="var(--c-gold)" />
              <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--c-primary)' }}>
                {xp.toLocaleString()} XP
              </span>
            </div>

            {streak > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Flame size={12} color="var(--c-gold)" />
                <span style={{ fontSize: 12, color: 'var(--c-gold)', fontWeight: 500 }}>
                  {streak} day streak
                </span>
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

      {/* Desktop sidebar — hidden on mobile via CSS */}
      <div className="desktop-sidebar">
        <Sidebar />
      </div>

      {/* Main content */}
      <main style={{ minHeight: '100vh' }} className="main-content">
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 16px' }}>
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <div className="mobile-nav">
        <BottomNav />
      </div>

      <style>{`
        .desktop-sidebar { display: none; }
        .mobile-nav      { display: block; }

        @media (min-width: 768px) {
          .desktop-sidebar { display: block; }
          .mobile-nav      { display: none; }
          .main-content {
            margin-left: var(--sidebar-width) !important;
            padding-bottom: 0 !important;
          }
        }

        /* Mobile: push content above bottom nav */
        @media (max-width: 767px) {
          .main-content {
            padding-bottom: calc(var(--nav-height) + 24px) !important;
          }
        }
      `}</style>
    </div>
  )
}