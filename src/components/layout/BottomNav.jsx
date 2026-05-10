import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'

const TABS = [
  {
    to: '/home',
    label: 'Home',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path
          d="M3 9.5L11 3L19 9.5V19a1 1 0 01-1 1H14v-5H8v5H4a1 1 0 01-1-1V9.5z"
          fill={active ? 'var(--c-primary)' : 'none'}
          stroke={active ? 'var(--c-primary)' : 'var(--c-text-muted)'}
          strokeWidth="1.6" strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    to: '/learn',
    label: 'Learn',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="3" y="3" width="16" height="16" rx="3"
          fill={active ? 'var(--c-primary)' : 'none'}
          stroke={active ? 'var(--c-primary)' : 'var(--c-text-muted)'}
          strokeWidth="1.6"
        />
        <path d="M7 8h8M7 12h6M7 16h4"
          stroke={active ? '#fff' : 'var(--c-text-muted)'}
          strokeWidth="1.5" strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    to: '/stats',
    label: 'Stats',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="3" y="13" width="4" height="6" rx="1" fill={active ? 'var(--c-primary)' : 'var(--c-text-muted)'} />
        <rect x="9" y="8" width="4" height="11" rx="1" fill={active ? 'var(--c-primary)' : 'var(--c-text-muted)'} opacity={active ? 1 : 0.5} />
        <rect x="15" y="3" width="4" height="16" rx="1" fill={active ? 'var(--c-primary)' : 'var(--c-text-muted)'} opacity={active ? 1 : 0.25} />
      </svg>
    ),
  },
  {
    to: '/compete',
    label: 'Compete',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path
          d="M11 3l2 4 4.5.7-3.25 3.15.77 4.48L11 13.25l-4.02 2.1.77-4.48L4.5 7.7 9 7z"
          fill={active ? 'var(--c-gold)' : 'none'}
          stroke={active ? 'var(--c-gold)' : 'var(--c-text-muted)'}
          strokeWidth="1.6" strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    to: '/profile',
    label: 'Profile',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="8" r="3.5"
          fill={active ? 'var(--c-primary)' : 'none'}
          stroke={active ? 'var(--c-primary)' : 'var(--c-text-muted)'}
          strokeWidth="1.6"
        />
        <path d="M4 19c0-3.866 3.134-7 7-7 3.866 0 7 3.134 7 7"
          stroke={active ? 'var(--c-primary)' : 'var(--c-text-muted)'}
          strokeWidth="1.6" strokeLinecap="round"
        />
      </svg>
    ),
  },
]

export function BottomNav() {
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      background: 'var(--c-bg)',
      borderTop: '1px solid var(--c-border)',
      display: 'flex', alignItems: 'center',
      height: 'var(--nav-height)',
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {TABS.map(({ to, label, icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/home'}
          style={{ flex: 1, textDecoration: 'none' }}
        >
          {({ isActive }) => (
            <div style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 3, padding: '6px 0', position: 'relative',
            }}>
              {/* Active top bar */}
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-bar"
                  style={{
                    position: 'absolute', top: -1, left: '50%',
                    transform: 'translateX(-50%)',
                    width: 24, height: 3,
                    background: 'var(--c-primary)',
                    borderRadius: '0 0 3px 3px',
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}

              {icon(isActive)}

              <span style={{
                fontSize: 10, fontWeight: isActive ? 600 : 400,
                color: isActive ? 'var(--c-primary)' : 'var(--c-text-muted)',
                transition: 'color 0.15s ease',
              }}>
                {label}
              </span>
            </div>
          )}
        </NavLink>
      ))}
    </nav>
  )
}