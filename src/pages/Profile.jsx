import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Mail, Target, Shield, LogOut,
  ChevronRight, Check, Moon, Sun, BarChart2,
  Trophy, X, Edit2, Eye, EyeOff
} from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useUserStore, getLevel, getLevelProgress } from '../stores/userStore'
import { useDarkMode } from '../hooks/useDarkMode'

// ─── Avatar system — colored initials, no emojis ──────────────────────────────

const AVATAR_COLORS = [
  { bg: '#8b1a2e', text: '#fff' }, // crimson
  { bg: '#1D9E75', text: '#fff' }, // teal
  { bg: '#3b5bdb', text: '#fff' }, // blue
  { bg: '#c9963a', text: '#fff' }, // gold
  { bg: '#5c111e', text: '#fff' }, // deep crimson
  { bg: '#0f6e56', text: '#fff' }, // deep teal
  { bg: '#1a1a2e', text: '#fff' }, // navy
  { bg: '#6741d9', text: '#fff' }, // purple
  { bg: '#D85A30', text: '#fff' }, // coral
  { bg: '#2c7a7b', text: '#fff' }, // dark cyan
  { bg: '#862e9c', text: '#fff' }, // violet
  { bg: '#2f9e44', text: '#fff' }, // green
]

function AvatarDisplay({ avatarId, username, size = 52 }) {
  const color = AVATAR_COLORS[avatarId % AVATAR_COLORS.length] || AVATAR_COLORS[0]
  const initials = username
    ? username.slice(0, 2).toUpperCase()
    : 'VO'
  const fontSize = size * 0.36

  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.28,
      background: color.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
      boxShadow: `0 2px 10px ${color.bg}44`,
    }}>
      <span style={{
        color: color.text, fontWeight: 800,
        fontSize, letterSpacing: '0.02em',
        fontFamily: 'Georgia, serif',
      }}>
        {initials}
      </span>
    </div>
  )
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
        color: 'var(--c-text-muted)', textTransform: 'uppercase',
        marginBottom: 8, paddingLeft: 4,
      }}>
        {title}
      </div>
      <div style={{
        background: 'var(--c-bg)',
        border: '1px solid var(--c-border)',
        borderRadius: 'var(--r-card)',
        overflow: 'hidden',
      }}>
        {children}
      </div>
    </div>
  )
}

// ─── Row item ─────────────────────────────────────────────────────────────────

function Row({ icon, label, value, onClick, danger = false, last = false, rightElement }) {
  return (
    <motion.div
      whileTap={onClick ? { backgroundColor: 'var(--c-bg-subtle)' } : {}}
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 16px',
        borderBottom: last ? 'none' : '1px solid var(--c-border)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background 0.15s ease',
      }}
    >
      <div style={{
        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
        background: danger ? 'var(--c-danger-pale)' : 'var(--c-bg-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </div>

      <span style={{
        flex: 1, fontSize: 15,
        color: danger ? 'var(--c-danger)' : 'var(--c-text)',
        fontWeight: danger ? 600 : 400,
      }}>
        {label}
      </span>

      {value && (
        <span style={{ fontSize: 13, color: 'var(--c-text-muted)', marginRight: 4 }}>
          {value}
        </span>
      )}

      {rightElement}

      {onClick && !rightElement && (
        <ChevronRight size={16} color="var(--c-text-muted)" />
      )}
    </motion.div>
  )
}

// ─── Dark mode row ────────────────────────────────────────────────────────────

function DarkModeRow({ last }) {
  const { isDark, toggle } = useDarkMode()

  return (
    <Row
      icon={isDark
        ? <Sun size={15} color="var(--c-gold)" />
        : <Moon size={15} color="var(--c-text-muted)" />
      }
      label={isDark ? 'Light mode' : 'Dark mode'}
      last={last}
      onClick={toggle}
      rightElement={
        <div
          style={{
            width: 44, height: 24, borderRadius: 12,
            background: isDark ? 'var(--c-primary)' : 'var(--c-border)',
            position: 'relative',
            transition: 'background 0.2s ease',
            flexShrink: 0,
          }}
        >
          <div style={{
            position: 'absolute',
            top: 3, left: isDark ? 23 : 3,
            width: 18, height: 18, borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
            transition: 'left 0.2s ease',
          }} />
        </div>
      }
    />
  )
}

// ─── Avatar picker modal ──────────────────────────────────────────────────────

function AvatarModal({ current, username, onSelect, onClose }) {
  const [selected, setSelected] = useState(current)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480,
          background: 'var(--c-bg)',
          borderRadius: '20px 20px 0 0',
          padding: '20px 20px 40px',
        }}
      >
        {/* Handle */}
        <div style={{
          width: 36, height: 4, borderRadius: 2,
          background: 'var(--c-border)', margin: '0 auto 20px',
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--c-text)' }}>
            Choose avatar
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-text-muted)', padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        {/* Avatar grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)',
          gap: 10, marginBottom: 24,
        }}>
          {AVATAR_COLORS.map((_, i) => (
            <motion.button
              key={i}
              whileTap={{ scale: 0.88 }}
              onClick={() => setSelected(i)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: 0, position: 'relative',
                borderRadius: 14,
                outline: selected === i ? `2.5px solid var(--c-primary)` : 'none',
                outlineOffset: 2,
              }}
            >
              <AvatarDisplay avatarId={i} username={username} size={52} />
              {selected === i && (
                <div style={{
                  position: 'absolute', bottom: -2, right: -2,
                  width: 18, height: 18, borderRadius: '50%',
                  background: 'var(--c-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '2px solid var(--c-bg)',
                }}>
                  <Check size={10} color="#fff" strokeWidth={3} />
                </div>
              )}
            </motion.button>
          ))}
        </div>

        <button
          onClick={() => { onSelect(selected); onClose() }}
          style={{
            width: '100%', minHeight: 48,
            background: 'var(--c-primary)', color: '#fff',
            border: 'none', borderRadius: 'var(--r-sm)',
            fontSize: 15, fontWeight: 600, cursor: 'pointer',
          }}
        >
          Save
        </button>
      </motion.div>
    </motion.div>
  )
}

// ─── Daily goal modal ─────────────────────────────────────────────────────────

const DAILY_GOALS = [
  { value: 5,  label: '5 words/day',  sub: 'Casual',   mins: '~5 min'  },
  { value: 10, label: '10 words/day', sub: 'Regular',  mins: '~10 min' },
  { value: 15, label: '15 words/day', sub: 'Focused',  mins: '~15 min' },
  { value: 20, label: '20 words/day', sub: 'Intense',  mins: '~20 min' },
  { value: 30, label: '30 words/day', sub: 'Champion', mins: '~30 min' },
]

function GoalModal({ current, onSelect, onClose }) {
  const [selected, setSelected] = useState(current)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480,
          background: 'var(--c-bg)',
          borderRadius: '20px 20px 0 0',
          padding: '20px 20px 40px',
        }}
      >
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--c-border)', margin: '0 auto 20px' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--c-text)' }}>Daily goal</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-text-muted)', padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {DAILY_GOALS.map(({ value, label, sub, mins }) => {
            const active = selected === value
            return (
              <motion.button
                key={value}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelected(value)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '13px 16px', textAlign: 'left',
                  background: active ? 'var(--c-primary-pale)' : 'var(--c-bg-subtle)',
                  border: `1.5px solid ${active ? 'var(--c-primary)' : 'transparent'}`,
                  borderRadius: 'var(--r-sm)', cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: active ? 'var(--c-primary)' : 'var(--c-text)' }}>
                      {label}
                    </span>
                    <span style={{
                      fontSize: 11, padding: '1px 7px', borderRadius: 99,
                      background: active ? 'var(--c-primary)' : 'var(--c-border)',
                      color: active ? '#fff' : 'var(--c-text-muted)',
                    }}>
                      {sub}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--c-text-muted)', marginTop: 2 }}>{mins}</div>
                </div>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                  border: `2px solid ${active ? 'var(--c-primary)' : 'var(--c-border)'}`,
                  background: active ? 'var(--c-primary)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s ease',
                }}>
                  {active && <Check size={11} color="#fff" strokeWidth={3} />}
                </div>
              </motion.button>
            )
          })}
        </div>

        <button
          onClick={() => { onSelect(selected); onClose() }}
          style={{
            width: '100%', minHeight: 48,
            background: 'var(--c-primary)', color: '#fff',
            border: 'none', borderRadius: 'var(--r-sm)',
            fontSize: 15, fontWeight: 600, cursor: 'pointer',
          }}
        >
          Save
        </button>
      </motion.div>
    </motion.div>
  )
}

// ─── Username modal ───────────────────────────────────────────────────────────

function UsernameModal({ current, onSave, onClose }) {
  const [value,   setValue]   = useState(current || '')
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!value.trim())          { setError('Username cannot be empty'); return }
    if (value.trim().length < 3) { setError('Minimum 3 characters'); return }
    setLoading(true)
    try {
      await onSave(value.trim())
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to update')
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 24px',
      }}
    >
      <motion.div
        initial={{ scale: 0.93, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.93, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 380,
          background: 'var(--c-bg)',
          borderRadius: 'var(--r-card)',
          padding: '24px',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--c-text)' }}>
            Change username
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-text-muted)', padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        <input
          autoFocus
          value={value}
          onChange={e => { setValue(e.target.value); setError('') }}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          placeholder="New username"
          style={{
            width: '100%', padding: '12px 14px', minHeight: 48,
            background: 'var(--c-bg-subtle)',
            border: `1.5px solid ${error ? 'var(--c-danger)' : 'var(--c-border)'}`,
            borderRadius: 'var(--r-sm)', fontSize: 16,
            color: 'var(--c-text)', outline: 'none',
            marginBottom: error ? 6 : 16, boxSizing: 'border-box',
            transition: 'border-color 0.15s ease',
          }}
          onFocus={e => { if (!error) e.target.style.borderColor = 'var(--c-primary)' }}
          onBlur={e => { if (!error) e.target.style.borderColor = 'var(--c-border)' }}
        />
        {error && (
          <p style={{ fontSize: 12, color: 'var(--c-danger)', marginBottom: 14 }}>{error}</p>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, minHeight: 44,
            background: 'transparent', border: '1px solid var(--c-border)',
            borderRadius: 'var(--r-sm)', color: 'var(--c-text-muted)',
            fontSize: 14, cursor: 'pointer',
          }}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              flex: 2, minHeight: 44,
              background: 'var(--c-primary)', color: '#fff',
              border: 'none', borderRadius: 'var(--r-sm)',
              fontSize: 14, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            {loading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }}
              />
            ) : 'Save'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Sign out confirm modal ───────────────────────────────────────────────────

function SignOutModal({ onConfirm, onClose, loading }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 24px',
      }}
    >
      <motion.div
        initial={{ scale: 0.93, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.93, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 340,
          background: 'var(--c-bg)',
          borderRadius: 'var(--r-card)',
          padding: '28px 24px',
          boxShadow: 'var(--shadow-lg)',
          textAlign: 'center',
        }}
      >
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: 'var(--c-danger-pale)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
        }}>
          <LogOut size={22} color="var(--c-danger)" />
        </div>

        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--c-text)', marginBottom: 8 }}>
          Sign out?
        </div>
        <div style={{ fontSize: 14, color: 'var(--c-text-muted)', marginBottom: 24, lineHeight: 1.5 }}>
          Your progress is saved. You can log back in anytime.
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              flex: 1, minHeight: 44,
              background: 'transparent',
              border: '1px solid var(--c-border)',
              borderRadius: 'var(--r-sm)',
              color: 'var(--c-text-muted)',
              fontSize: 14, cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              flex: 1, minHeight: 44,
              background: 'var(--c-danger)', color: '#fff',
              border: 'none', borderRadius: 'var(--r-sm)',
              fontSize: 14, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            {loading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }}
              />
            ) : (
              <>
                <LogOut size={14} />
                Sign out
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Profile page ─────────────────────────────────────────────────────────────

export function Profile() {
  const navigate                            = useNavigate()
  const { profile, updateProfile, signOut } = useAuthStore()
  const { words }                           = useUserStore()

  const [modal,          setModal]          = useState(null)
  const [signingOut,     setSigningOut]      = useState(false)

  const xp       = profile?.total_xp || 0
  const level    = getLevel(xp)
  const progress = getLevelProgress(xp)
  const streak   = profile?.current_streak || 0
  const mastered = words.filter(w => w.state === 'mastered').length

  const handleUpdate = async (updates) => {
    await updateProfile(updates)
  }

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await signOut()
      navigate('/', { replace: true })
    } catch (err) {
      console.error('Sign out error:', err)
      setSigningOut(false)
      setModal(null)
    }
  }

  return (
    <div style={{ paddingTop: 20, paddingBottom: 8 }}>

      {/* Profile hero */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'var(--c-bg)',
          border: '1px solid var(--c-border)',
          borderRadius: 'var(--r-card)',
          padding: '24px 20px',
          marginBottom: 20,
          position: 'relative', overflow: 'hidden',
        }}
      >
        {/* Background decoration */}
        <div style={{
          position: 'absolute', top: -30, right: -30,
          width: 120, height: 120, borderRadius: '50%',
          background: 'var(--c-primary-pale)', pointerEvents: 'none',
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
          {/* Avatar */}
          <div style={{ position: 'relative' }}>
            <AvatarDisplay
              avatarId={profile?.avatar_id ?? 0}
              username={profile?.username}
              size={64}
            />
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setModal('avatar')}
              style={{
                position: 'absolute', bottom: -4, right: -4,
                width: 24, height: 24, borderRadius: '50%',
                background: 'var(--c-primary)',
                border: '2px solid var(--c-bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <Edit2 size={11} color="#fff" strokeWidth={2.5} />
            </motion.button>
          </div>

          {/* Name + level */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--c-text)', marginBottom: 3 }}>
              {profile?.username || 'Learner'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--c-text-muted)', marginBottom: 6 }}>
              {profile?.email}
            </div>
            <span style={{
              display: 'inline-block',
              fontSize: 11, fontWeight: 700,
              color: 'var(--c-primary)',
              background: 'var(--c-primary-pale)',
              padding: '2px 10px', borderRadius: 99,
            }}>
              {level.label}
            </span>
          </div>
        </div>

        {/* XP bar */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>
              {xp.toLocaleString()} XP
            </span>
            <span style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>
              {level.max !== Infinity
                ? `${(level.max + 1 - xp).toLocaleString()} to next level`
                : 'Max level reached'
              }
            </span>
          </div>
          <div style={{ height: 6, background: 'var(--c-border)', borderRadius: 3, overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }}
              style={{ height: '100%', background: 'var(--c-primary)', borderRadius: 3 }}
            />
          </div>
        </div>

        {/* Quick stats */}
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            // { icon: <BookOpen size={14} color="var(--c-primary)" />, value: words.length,  label: 'Words'    },
            { icon: <Check size={14} color="var(--c-success)" />,    value: mastered,      label: 'Mastered' },
            { icon: <Shield size={14} color="var(--c-gold)" />,      value: streak,        label: 'Streak'   },
          ].map(({ icon, value, label }) => (
            <div key={label} style={{
              flex: 1, textAlign: 'center',
              background: 'var(--c-bg-subtle)',
              borderRadius: 'var(--r-sm)', padding: '10px 4px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
                {icon}
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--c-text)' }}>{value}</div>
              <div style={{ fontSize: 10, color: 'var(--c-text-muted)' }}>{label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Account */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <Section title="Account">
          <Row
            icon={<User size={15} color="var(--c-text-muted)" />}
            label="Username"
            value={profile?.username}
            onClick={() => setModal('username')}
          />
          <Row
            icon={<Mail size={15} color="var(--c-text-muted)" />}
            label="Email"
            value={profile?.email}
            last
          />
        </Section>
      </motion.div>

      {/* Learning */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
        <Section title="Learning">
          <Row
            icon={<Target size={15} color="var(--c-text-muted)" />}
            label="Daily goal"
            value={`${profile?.daily_goal || 10} words/day`}
            onClick={() => setModal('goal')}
          />
          <Row
            icon={<Shield size={15} color="var(--c-text-muted)" />}
            label="Streak freeze"
            value={profile?.streak_freeze_available ? '1 available' : 'Used this week'}
            last
          />
        </Section>
      </motion.div>

      {/* Appearance */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
        <Section title="Appearance">
          <DarkModeRow last />
        </Section>
      </motion.div>

      {/* Navigate */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Section title="Progress">
          <Row
            icon={<BarChart2 size={15} color="var(--c-text-muted)" />}
            label="View full stats"
            onClick={() => navigate('/stats')}
          />
          <Row
            icon={<Trophy size={15} color="var(--c-text-muted)" />}
            label="Leaderboard"
            onClick={() => navigate('/compete')}
            last
          />
        </Section>
      </motion.div>

      {/* Sign out */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}>
        <Section title="Session">
          <Row
            icon={<LogOut size={15} color="var(--c-danger)" />}
            label="Sign out"
            danger
            onClick={() => setModal('signout')}
            last
          />
        </Section>
      </motion.div>

      {/* Version */}
      <div style={{ textAlign: 'center', padding: '8px 0 4px', fontSize: 11, color: 'var(--c-text-muted)' }}>
        Vocabook © 2025
      </div>

      {/* Modals */}
      <AnimatePresence>
        {modal === 'avatar' && (
          <AvatarModal
            current={profile?.avatar_id ?? 0}
            username={profile?.username}
            onSelect={id => handleUpdate({ avatar_id: id })}
            onClose={() => setModal(null)}
          />
        )}
        {modal === 'goal' && (
          <GoalModal
            current={profile?.daily_goal || 10}
            onSelect={goal => handleUpdate({ daily_goal: goal })}
            onClose={() => setModal(null)}
          />
        )}
        {modal === 'username' && (
          <UsernameModal
            current={profile?.username}
            onSave={username => handleUpdate({ username })}
            onClose={() => setModal(null)}
          />
        )}
        {modal === 'signout' && (
          <SignOutModal
            onConfirm={handleSignOut}
            onClose={() => setModal(null)}
            loading={signingOut}
          />
        )}
      </AnimatePresence>
    </div>
  )
}