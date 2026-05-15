import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, CheckCircle } from 'lucide-react'

/**
 * DailyGoalPicker
 * 
 * User selects their daily commitment (minutes per day).
 * This determines session size: 5min = 5 words, 10min = 10 words, etc.
 * 
 * Props:
 *   onSelect: (minutes: number) => void
 */
export function DailyGoalPicker({ onSelect }) {
  const [selected, setSelected] = useState(null)
  const [confirming, setConfirming] = useState(false)

  const goals = [
    { minutes: 5, label: '5 minutes', desc: 'Light & Consistent', wordsPerDay: 5 },
    { minutes: 10, label: '10 minutes', desc: 'Steady Progress', wordsPerDay: 10 },
    { minutes: 15, label: '15 minutes', desc: 'Focused Learning', wordsPerDay: 15 },
    { minutes: 20, label: '20 minutes', desc: 'Strong Momentum', wordsPerDay: 20 },
    { minutes: 30, label: '30 minutes', desc: 'Intensive Growth', wordsPerDay: 30 },
  ]

  const handleConfirm = async () => {
    if (selected === null) return
    setConfirming(true)
    await new Promise((resolve) => setTimeout(resolve, 300))
    onSelect(selected)
  }

  return (
    <div
      style={{
        minHeight: '100svh',
        background: 'var(--c-bg-off)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 480 }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{ textAlign: 'center', marginBottom: 40 }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              background: 'var(--c-primary)',
              borderRadius: 16,
              margin: '0 auto 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <Clock size={28} color="#fff" strokeWidth={2} />
          </div>

          <h2
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: 'var(--c-text)',
              margin: '0 0 8px 0',
              fontFamily: 'Georgia, serif',
            }}
          >
            Your daily commitment
          </h2>

          <p
            style={{
              fontSize: 15,
              color: 'var(--c-text-muted)',
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            How many minutes per day can you dedicate to learning?
          </p>
        </motion.div>

        {/* Goal cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
          <AnimatePresence mode="wait">
            {goals.map((goal, idx) => (
              <motion.button
                key={goal.minutes}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.08 }}
                disabled={confirming}
                onClick={() => setSelected(goal.minutes)}
                style={{
                  width: '100%',
                  padding: '18px 20px',
                  textAlign: 'left',
                  background:
                    selected === goal.minutes
                      ? 'var(--c-primary)'
                      : 'var(--c-bg)',
                  border:
                    selected === goal.minutes
                      ? '2px solid var(--c-primary)'
                      : '1.5px solid var(--c-border)',
                  borderRadius: 'var(--r-sm)',
                  cursor: confirming ? 'not-allowed' : 'pointer',
                  opacity: confirming && selected !== goal.minutes ? 0.5 : 1,
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                }}
                onHoverStart={
                  !confirming
                    ? undefined
                    : () => {}
                }
              >
                {/* Left: Time badge */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    flexShrink: 0,
                  }}
                >
                  <Clock
                    size={18}
                    color={
                      selected === goal.minutes
                        ? '#fff'
                        : 'var(--c-primary)'
                    }
                    strokeWidth={2}
                  />
                  <span
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color:
                        selected === goal.minutes
                          ? '#fff'
                          : 'var(--c-text)',
                    }}
                  >
                    {goal.minutes}m
                  </span>
                </div>

                {/* Middle: Label & desc */}
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color:
                        selected === goal.minutes
                          ? '#fff'
                          : 'var(--c-text)',
                      marginBottom: 2,
                    }}
                  >
                    {goal.label}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color:
                        selected === goal.minutes
                          ? 'rgba(255,255,255,0.75)'
                          : 'var(--c-text-muted)',
                    }}
                  >
                    {goal.desc} • {goal.wordsPerDay} words/session
                  </div>
                </div>

                {/* Right: Checkmark */}
                <motion.div
                  animate={
                    selected === goal.minutes
                      ? { scale: 1, opacity: 1 }
                      : { scale: 0.8, opacity: 0 }
                  }
                  transition={{ duration: 0.2 }}
                  style={{ flexShrink: 0 }}
                >
                  <CheckCircle
                    size={20}
                    color="#fff"
                    fill="currentColor"
                    strokeWidth={2}
                  />
                </motion.div>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>

        {/* Info box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          style={{
            background: 'var(--c-primary-pale)',
            border: '1px solid var(--c-primary)',
            borderRadius: 'var(--r-card)',
            padding: '16px',
            marginBottom: 28,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--c-primary)',
              marginBottom: 8,
            }}
          >
            💡 Tip
          </div>
          <div
            style={{
              fontSize: 13,
              color: 'var(--c-text-muted)',
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            Pick a realistic goal you can stick to. You can adjust it anytime in Settings. Consistency matters more than volume.
          </div>
        </motion.div>

        {/* Confirm button */}
        <motion.button
          animate={
            selected !== null
              ? { opacity: 1, y: 0 }
              : { opacity: 0.5, y: 10 }
          }
          whileTap={selected !== null && !confirming ? { scale: 0.97 } : {}}
          disabled={selected === null || confirming}
          onClick={handleConfirm}
          style={{
            width: '100%',
            minHeight: 54,
            background:
              selected !== null ? 'var(--c-primary)' : 'var(--c-border)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--r-sm)',
            fontSize: 16,
            fontWeight: 700,
            cursor:
              selected !== null && !confirming ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {confirming ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                style={{ display: 'flex', alignItems: 'center' }}
              >
                <div
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    borderTop: '2px solid #fff',
                    borderRight: '2px solid transparent',
                  }}
                />
              </motion.div>
              Preparing your journey...
            </>
          ) : selected !== null ? (
            <>
              Let's go
              <motion.div
                animate={{ x: 4 }}
                transition={{ duration: 0.6, repeat: Infinity, repeatType: 'reverse' }}
              >
                →
              </motion.div>
            </>
          ) : (
            'Select a goal to continue'
          )}
        </motion.button>
      </div>
    </div>
  )
}
