import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { DarkModeRow } from '../components/DarkModeRow'
import { useUserStore, getLevel, getLevelProgress } from '../stores/userStore'

// ─── Constants ────────────────────────────────────────────────────────────────

const AVATARS = [
  '🦁','🐯','🦊','🐺','🐻','🦋',
  '🐉','🦅','🌟','⚡','🎯','🔥',
  '💎','🚀','🌊','🏔️','🌙','☀️','🎪','🎭',
]

const DAILY_GOALS = [5, 10, 15, 20, 30]

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

function Row({ icon, label, value, onClick, danger = false, last = false }) {
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
      <span style={{ fontSize: 18, width: 24, textAlign: 'center', flexShrink: 0 }}>
        {icon}
      </span>
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
      {onClick && (
        <span style={{ fontSize: 16, color: 'var(--c-text-muted)' }}>›</span>
      )}
    </motion.div>
  )
}

// ─── Avatar picker modal ──────────────────────────────────────────────────────

function AvatarModal({ current, onSelect, onClose }) {
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
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480,
          background: 'var(--c-bg)',
          borderRadius: '20px 20px 0 0',
          padding: '20px 20px 36px',
        }}
      >
        <div style={{
          width: 40, height: 4, borderRadius: 2,
          background: 'var(--c-border)', margin: '0 auto 20px',
        }} />
        <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--c-text)', marginBottom: 16 }}>
          Choose avatar
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 8, marginBottom: 20 }}>
          {AVATARS.map((emoji, i) => (
            <motion.button
              key={i}
              whileTap={{ scale: 0.85 }}
              onClick={() => setSelected(i)}
              style={{
                fontSize: 22, padding: 6,
                borderRadius: 'var(--r-sm)',
                border: `2px solid ${selected === i ? 'var(--c-primary)' : 'transparent'}`,
                background: selected === i ? 'var(--c-primary-pale)' : 'transparent',
                cursor: 'pointer', transition: 'all 0.15s ease', lineHeight: 1,
              }}
            >
              {emoji}
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

function GoalModal({ current, onSelect, onClose }) {
  const [selected, setSelected] = useState(current)
  const labels = { 5: 'Casual', 10: 'Regular', 15: 'Focused', 20: 'Intense', 30: 'Champion' }
  const emojis = { 5: '🌱', 10: '📚', 15: '🎯', 20: '🔥', 30: '🏆' }

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
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480,
          background: 'var(--c-bg)',
          borderRadius: '20px 20px 0 0',
          padding: '20px 20px 36px',
        }}
      >
        <div style={{
          width: 40, height: 4, borderRadius: 2,
          background: 'var(--c-border)', margin: '0 auto 20px',
        }} />
        <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--c-text)', marginBottom: 16 }}>
          Daily goal
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {DAILY_GOALS.map(g => (
            <motion.button
              key={g}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelected(g)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '12px 16px', textAlign: 'left',
                background: selected === g ? 'var(--c-primary-pale)' : 'var(--c-bg-subtle)',
                border: `2px solid ${selected === g ? 'var(--c-primary)' : 'transparent'}`,
                borderRadius: 'var(--r-sm)', cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ fontSize: 22 }}>{emojis[g]}</span>
              <div style={{ flex: 1 }}>
                <span style={{
                  fontSize: 15, fontWeight: 600,
                  color: selected === g ? 'var(--c-primary)' : 'var(--c-text)',
                }}>
                  {g} words/day
                </span>
                <span style={{
                  fontSize: 12, color: 'var(--c-text-muted)', marginLeft: 8,
                }}>
                  {labels[g]}
                </span>
              </div>
              {selected === g && (
                <div style={{
                  width: 18, height: 18, borderRadius: '50%',
                  background: 'var(--c-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }} />
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

// ─── Edit username modal ──────────────────────────────────────────────────────

function UsernameModal({ current, onSave, onClose }) {
  const [value,   setValue]   = useState(current || '')
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!value.trim()) { setError('Username cannot be empty'); return }
    if (value.trim().length < 3) { setError('Min 3 characters'); return }
    setLoading(true)
    try { await onSave(value.trim()); onClose() }
    catch (e) { setError(e.message || 'Failed to update'); setLoading(false) }
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
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 380,
          background: 'var(--c-bg)',
          borderRadius: 'var(--r-card)',
          padding: '24px',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--c-text)', marginBottom: 16 }}>
          Change username
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
            color: 'var(--c-text)', outline: 'none', marginBottom: 8,
            boxSizing: 'border-box',
          }}
        />
        {error && (
          <div style={{ fontSize: 12, color: 'var(--c-danger)', marginBottom: 12 }}>{error}</div>
        )}
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
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
            }}
          >
            {loading ? 'Saving…' : 'Save'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Profile page ─────────────────────────────────────────────────────────────

export function Profile() {
  const navigate                     = useNavigate()
  const { profile, updateProfile, signOut } = useAuthStore()
  const { words }                    = useUserStore()

  const [modal,       setModal]       = useState(null) // 'avatar'|'goal'|'username'|'signout'
  const [saving,      setSaving]      = useState(false)

  const xp      = profile?.total_xp || 0
  const level   = getLevel(xp)
  const progress = getLevelProgress(xp)
  const avatar  = AVATARS[profile?.avatar_id ?? 0]
  const streak  = profile?.current_streak || 0

  const handleUpdate = async (updates) => {
    setSaving(true)
    try { await updateProfile(updates) }
    finally { setSaving(false) }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/onboarding', { replace: true })
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
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background decoration */}
        <div style={{
          position: 'absolute', top: -30, right: -30,
          width: 120, height: 120, borderRadius: '50%',
          background: 'var(--c-primary-pale)', pointerEvents: 'none',
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          {/* Avatar */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => setModal('avatar')}
            style={{
              width: 64, height: 64, fontSize: 36,
              background: 'var(--c-primary-pale)',
              border: '2px solid var(--c-primary)',
              borderRadius: 18, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, position: 'relative',
            }}
          >
            {avatar}
            <div style={{
              position: 'absolute', bottom: -4, right: -4,
              width: 20, height: 20, borderRadius: '50%',
              background: 'var(--c-primary)',
              border: '2px solid var(--c-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, color: '#fff',
            }}>
              ✏️
            </div>
          </motion.button>

          {/* Name + level */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--c-text)' }}>
                {profile?.username || 'Learner'}
              </div>
              {streak >= 3 && (
                <span style={{ fontSize: 14 }}>🔥</span>
              )}
            </div>
            <div style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>
              {profile?.email}
            </div>
            <span style={{
              display: 'inline-block', marginTop: 6,
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
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>
              ⚡ {xp.toLocaleString()} XP
            </span>
            <span style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>
              {level.max !== Infinity
                ? `${(level.max + 1 - xp).toLocaleString()} to next level`
                : '🏆 Max level'
              }
            </span>
          </div>
          <div style={{ height: 6, background: 'var(--c-border)', borderRadius: 3, overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
              style={{ height: '100%', background: 'var(--c-primary)', borderRadius: 3 }}
            />
          </div>
        </div>

        {/* Quick stats */}
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { emoji: '📚', value: words.length,                                      label: 'Words'   },
            { emoji: '✅', value: words.filter(w => w.state === 'mastered').length,  label: 'Mastered'},
            { emoji: '🔥', value: streak,                                            label: 'Streak'  },
          ].map(({ emoji, value, label }) => (
            <div key={label} style={{
              flex: 1, textAlign: 'center',
              background: 'var(--c-bg-subtle)',
              borderRadius: 'var(--r-sm)', padding: '10px 4px',
            }}>
              <div style={{ fontSize: 18, marginBottom: 2 }}>{emoji}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--c-primary)' }}>{value}</div>
              <div style={{ fontSize: 10, color: 'var(--c-text-muted)' }}>{label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Account */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Section title="Account">
          <Row
            icon="👤"
            label="Username"
            value={profile?.username}
            onClick={() => setModal('username')}
          />
          <Row
            icon="📧"
            label="Email"
            value={profile?.email}
          />
          <Row
            icon="🖼️"
            label="Avatar"
            value={avatar}
            onClick={() => setModal('avatar')}
            last
          />
        </Section>
      </motion.div>

      {/* Learning */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Section title="Learning">
          <Row
            icon="🎯"
            label="Daily goal"
            value={`${profile?.daily_goal || 10} words/day`}
            onClick={() => setModal('goal')}
          />
          <Row
            icon="🧊"
            label="Streak freeze"
            value={profile?.streak_freeze_available ? '1 available' : 'Used this week'}
            last
          />
        </Section>
      </motion.div>
      
<Section title="Appearance">
  <DarkModeRow />
</Section>

      {/* Progress */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Section title="Progress">
          <Row
            icon="📊"
            label="View full stats"
            onClick={() => navigate('/stats')}
          />
          <Row
            icon="🏆"
            label="Leaderboard"
            onClick={() => navigate('/compete')}
            last
          />
        </Section>
      </motion.div>

      {/* Danger zone */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Section title="Account">
          <Row
            icon="🚪"
            label="Sign out"
            danger
            onClick={() => setModal('signout')}
            last
          />
        </Section>
      </motion.div>

      {/* Version */}
      <div style={{ textAlign: 'center', padding: '8px 0 4px', fontSize: 11, color: 'var(--c-text-muted)' }}>
        Vocabook © 2026
      </div>

      {/* ── Modals ── */}
      <AnimatePresence>
        {modal === 'avatar' && (
          <AvatarModal
            current={profile?.avatar_id ?? 0}
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setModal(null)}
            style={{
              position: 'fixed', inset: 0, zIndex: 100,
              background: 'rgba(0,0,0,0.45)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0 24px',
            }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%', maxWidth: 340,
                background: 'var(--c-bg)',
                borderRadius: 'var(--r-card)',
                padding: '24px',
                boxShadow: 'var(--shadow-lg)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 12 }}>👋</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--c-text)', marginBottom: 6 }}>
                Sign out?
              </div>
              <div style={{ fontSize: 13, color: 'var(--c-text-muted)', marginBottom: 24 }}>
                Your progress is saved. You can log back in anytime.
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setModal(null)}
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
                  onClick={handleSignOut}
                  style={{
                    flex: 1, minHeight: 44,
                    background: 'var(--c-danger)', color: '#fff',
                    border: 'none', borderRadius: 'var(--r-sm)',
                    fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  Sign out
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}