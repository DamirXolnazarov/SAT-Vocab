import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../stores/authStore'
import { useUserStore } from '../stores/userStore'

// ─── Checks if user has been absent 5+ days ───────────────────────────────────

export function useComeback() {
  const { profile }    = useAuthStore()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!profile?.last_active_date) return
    if (profile?.comeback_boost_active) return // already active

    const last    = new Date(profile.last_active_date)
    const now     = new Date()
    const diffDays = Math.floor((now - last) / (1000 * 60 * 60 * 24))

    if (diffDays >= 5) setShow(true)
  }, [profile?.id])

  return { show, dismiss: () => setShow(false) }
}

// ─── ComebackScreen ───────────────────────────────────────────────────────────

export function ComebackScreen({ onDismiss }) {
  const { profile, updateProfile } = useAuthStore()
  const { words }                  = useUserStore()
  const [claiming, setClaiming]    = useState(false)
  const [claimed,  setClaimed]     = useState(false)

  const last     = profile?.last_active_date
    ? new Date(profile.last_active_date)
    : null
  const daysGone = last
    ? Math.floor((Date.now() - last.getTime()) / (1000 * 60 * 60 * 24))
    : 0

  const mastered    = words.filter(w => w.state === 'mastered').length
  const learning    = words.filter(w => w.state === 'learning').length
  const struggling  = words.filter(w => w.state === 'struggling').length

  const handleClaim = async () => {
    setClaiming(true)
    try {
      const boostExpiry = new Date()
      boostExpiry.setHours(boostExpiry.getHours() + 24)
      await updateProfile({
        comeback_boost_active:    true,
        comeback_boost_expires_at: boostExpiry.toISOString(),
        last_active_date:         new Date().toISOString(),
      })
      setClaimed(true)
      setTimeout(onDismiss, 2000)
    } catch (err) {
      console.error('Comeback claim error:', err)
    } finally {
      setClaiming(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'linear-gradient(160deg, #3d0a15 0%, #8b1a2e 50%, #5c111e 100%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '32px 24px', textAlign: 'center',
        overflowY: 'auto',
      }}
    >
      {/* Background orb */}
      <div style={{
        position: 'absolute', top: '20%', left: '50%',
        transform: 'translateX(-50%)',
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(201,150,58,0.15) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 400, position: 'relative' }}>

        {/* Welcome emoji */}
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 14, delay: 0.1 }}
          style={{ fontSize: 72, marginBottom: 20 }}
        >
          👋
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div style={{
            fontSize: 28, fontWeight: 900, color: '#fff',
            fontFamily: 'Georgia, serif',
            letterSpacing: '-0.5px', marginBottom: 8,
          }}>
            Welcome back!
          </div>
          <div style={{
            fontSize: 16, color: 'rgba(255,255,255,0.65)',
            marginBottom: 32, lineHeight: 1.6,
          }}>
            You've been away for {daysGone} days.
            Your words missed you — let's pick up where you left off.
          </div>
        </motion.div>

        {/* Stats recap */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
            gap: 10, marginBottom: 28,
          }}
        >
          {[
            { emoji: '📚', label: 'Total words', value: words.length    },
            { emoji: '✅', label: 'Mastered',    value: mastered        },
            { emoji: '💪', label: 'Need review', value: struggling      },
          ].map(({ emoji, label, value }) => (
            <div key={label} style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 'var(--r-card)',
              padding: '14px 8px',
            }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{emoji}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>{value}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </motion.div>

        {/* 2x XP boost card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.45 }}
          style={{
            background: 'rgba(201,150,58,0.15)',
            border: '1.5px solid rgba(201,150,58,0.4)',
            borderRadius: 'var(--r-card)',
            padding: '20px',
            marginBottom: 24,
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 10 }}>⚡</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#f0c96a', marginBottom: 6 }}>
            2× XP Boost
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>
            As a welcome-back gift, earn double XP on every answer for the next 24 hours.
          </div>
        </motion.div>

        {/* CTA */}
        <AnimatePresence mode="wait">
          {claimed ? (
            <motion.div
              key="claimed"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                padding: '16px',
                background: 'rgba(29,158,117,0.2)',
                border: '1px solid rgba(29,158,117,0.4)',
                borderRadius: 'var(--r-sm)',
                color: '#4ade80',
                fontSize: 16, fontWeight: 700,
              }}
            >
              ✓ 2× XP activated! Let's go!
            </motion.div>
          ) : (
            <motion.button
              key="cta"
              whileTap={{ scale: 0.97 }}
              onClick={handleClaim}
              disabled={claiming}
              style={{
                width: '100%', minHeight: 56,
                background: 'var(--c-gold)', color: '#fff',
                border: 'none', borderRadius: 'var(--r-sm)',
                fontSize: 17, fontWeight: 800,
                cursor: claiming ? 'wait' : 'pointer',
                opacity: claiming ? 0.8 : 1,
                boxShadow: '0 4px 24px rgba(201,150,58,0.4)',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 8,
              }}
            >
              {claiming ? (
                <span style={{
                  width: 20, height: 20,
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff',
                  borderRadius: '50%',
                  animation: 'spin 0.7s linear infinite',
                  display: 'inline-block',
                }} />
              ) : '⚡ Claim 2× XP and start!'}
            </motion.button>
          )}
        </AnimatePresence>

        {/* Skip */}
        {!claimed && (
          <button
            onClick={onDismiss}
            style={{
              background: 'none', border: 'none',
              color: 'rgba(255,255,255,0.35)',
              fontSize: 13, cursor: 'pointer',
              marginTop: 16,
            }}
          >
            Skip for now
          </button>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </motion.div>
  )
}