import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, BookOpen, BarChart2, Trophy, User } from 'lucide-react'

const TABS = [
  { to: '/home',    label: 'Home',    Icon: Home     },
  { to: '/learn',   label: 'Learn',   Icon: BookOpen },
  { to: '/stats',   label: 'Stats',   Icon: BarChart2 },
  { to: '/compete', label: 'Compete', Icon: Trophy   },
  { to: '/profile', label: 'Profile', Icon: User     },
]

export function BottomNav() {
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      zIndex: 50,
      background: 'var(--c-bg)',
      borderTop: '1px solid var(--c-border)',
      display: 'flex', alignItems: 'center',
      height: 'var(--nav-height)',
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {TABS.map(({ to, label, Icon }) => (
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
              gap: 4, padding: '6px 0',
              position: 'relative',
            }}>
              {/* Top indicator — properly centered */}
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-indicator"
                  style={{
                    position: 'absolute',
                    top: -1,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 28, height: 3,
                    background: 'var(--c-primary)',
                    borderRadius: '0 0 3px 3px',
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}

              <Icon
                size={22}
                color={isActive ? 'var(--c-primary)' : 'var(--c-text-muted)'}
                strokeWidth={isActive ? 2.2 : 1.7}
                style={{ transition: 'color 0.15s ease' }}
              />

              <span style={{
                fontSize: 10,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? 'var(--c-primary)' : 'var(--c-text-muted)',
                transition: 'color 0.15s ease',
                letterSpacing: '0.01em',
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