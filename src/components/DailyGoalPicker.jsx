import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, CheckCircle, ChevronRight, Info } from 'lucide-react'

const GOALS = [
  { minutes: 5,  label: '5 minutes',  desc: 'Light & Consistent',  words: 5  },
  { minutes: 10, label: '10 minutes', desc: 'Steady Progress',      words: 10 },
  { minutes: 15, label: '15 minutes', desc: 'Focused Learning',     words: 15 },
  { minutes: 20, label: '20 minutes', desc: 'Strong Momentum',      words: 20 },
  { minutes: 30, label: '30 minutes', desc: 'Intensive Growth',     words: 30 },
]

export function DailyGoalPicker({ onSelect }) {
  const [selected,   setSelected]   = useState(null)
  const [confirming, setConfirming] = useState(false)

  const handleConfirm = async () => {
    if (selected === null) return
    setConfirming(true)
    await new Promise(res => setTimeout(res, 300))
    onSelect(selected)
  }

  return (
    <div style={{
      minHeight: '100svh',
      background: 'var(--c-bg-off)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: 480 }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{ textAlign: 'center', marginBottom: 36 }}
        >
          <div style={{
            width: 56, height: 56,
            background: 'var(--c-primary)',
            borderRadius: 16, margin: '0 auto 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(139,26,46,0.25)',
          }}>
            <Clock size={26} color="#fff" strokeWidth={2} />
          </div>

          <h2 style={{
            fontSize: 26, fontWeight: 800,
            color: 'var(--c-text)', margin: '0 0 8px',
            fontFamily: 'Georgia, serif', letterSpacing: '-0.3px',
          }}>
            Your daily commitment
          </h2>

          <p style={{
            fontSize: 15, color: 'var(--c-text-muted)',
            margin: 0, lineHeight: 1.6,
          }}>
            How many minutes per day can you dedicate to learning?
          </p>
        </motion.div>

        {/* Goal options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {GOALS.map((goal, idx) => {
            const active = selected === goal.minutes
            return (
              <motion.button
                key={goal.minutes}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, delay: idx * 0.07 }}
                disabled={confirming}
                onClick={() => setSelected(goal.minutes)}
                style={{
                  width: '100%', padding: '16px 18px',
                  textAlign: 'left',
                  background: active ? 'var(--c-primary)' : 'var(--c-bg)',
                  border: `1.5px solid ${active ? 'var(--c-primary)' : 'var(--c-border)'}`,
                  borderRadius: 'var(--r-sm)',
                  cursor: confirming ? 'not-allowed' : 'pointer',
                  opacity: confirming && !active ? 0.5 : 1,
                  transition: 'all 0.18s ease',
                  display: 'flex', alignItems: 'center', gap: 14,
                }}
              >
                {/* Clock icon + minutes */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <Clock
                    size={17}
                    color={active ? '#fff' : 'var(--c-primary)'}
                    strokeWidth={2}
                  />
                  <span style={{
                    fontSize: 17, fontWeight: 700,
                    color: active ? '#fff' : 'var(--c-text)',
                    letterSpacing: '-0.2px',
                  }}>
                    {goal.minutes}m
                  </span>
                </div>

                {/* Label + desc */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 14, fontWeight: 600,
                    color: active ? '#fff' : 'var(--c-text)',
                    marginBottom: 2,
                  }}>
                    {goal.label}
                  </div>
                  <div style={{
                    fontSize: 12,
                    color: active ? 'rgba(255,255,255,0.72)' : 'var(--c-text-muted)',
                  }}>
                    {goal.desc} · {goal.words} words/session
                  </div>
                </div>

                {/* Checkmark */}
                <motion.div
                  animate={{ scale: active ? 1 : 0.7, opacity: active ? 1 : 0 }}
                  transition={{ duration: 0.18 }}
                  style={{ flexShrink: 0 }}
                >
                  <CheckCircle size={20} color="#fff" fill="rgba(255,255,255,0.25)" strokeWidth={2} />
                </motion.div>
              </motion.button>
            )
          })}
        </div>

        {/* Tip box — no emoji, uses Info icon */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{
            display: 'flex', gap: 10,
            background: 'var(--c-primary-pale)',
            border: '1px solid rgba(139,26,46,0.15)',
            borderRadius: 'var(--r-sm)',
            padding: '12px 14px',
            marginBottom: 24,
          }}
        >
          <Info size={15} color="var(--c-primary)" style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 13, color: 'var(--c-text-muted)', margin: 0, lineHeight: 1.6 }}>
            Pick a realistic goal you can stick to. You can adjust it anytime in Settings.
            Consistency matters more than volume.
          </p>
        </motion.div>

        {/* Confirm button */}
        <motion.button
          animate={{ opacity: selected !== null ? 1 : 0.5 }}
          whileTap={selected !== null && !confirming ? { scale: 0.97 } : {}}
          disabled={selected === null || confirming}
          onClick={handleConfirm}
          style={{
            width: '100%', minHeight: 52,
            background: selected !== null ? 'var(--c-primary)' : 'var(--c-border)',
            color: '#fff', border: 'none',
            borderRadius: 'var(--r-sm)',
            fontSize: 16, fontWeight: 700,
            cursor: selected !== null && !confirming ? 'pointer' : 'not-allowed',
            transition: 'all 0.18s ease',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {confirming ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
                style={{
                  width: 17, height: 17, borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff',
                }}
              />
              Preparing your journey
            </>
          ) : selected !== null ? (
            <>
              Continue
              <ChevronRight size={18} strokeWidth={2.5} />
            </>
          ) : (
            'Select a goal to continue'
          )}
        </motion.button>

      </div>
    </div>
  )
}
