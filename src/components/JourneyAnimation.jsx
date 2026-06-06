import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GraduationCap, Clock, Map, Zap } from 'lucide-react'

// ─── Status messages ──────────────────────────────────────────────────────────

const MESSAGES = [
  'Identifying your level',
  'Setting your pace',
  'Building your roadmap',
  'Planning your journey',
  'Arranging your sessions',
  'Calibrating difficulty',
  'Preparing your first session',
  'Almost ready',
]

// ─── StatusMessage — cycles through messages in sync with cards ───────────────

function StatusMessage() {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setIdx(i => (i + 1) % MESSAGES.length)
    }, 1300)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <AnimatePresence mode="wait">
        <motion.p
          key={idx}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.28 }}
          style={{
            fontSize: 14, fontWeight: 500,
            color: 'rgba(255,255,255,0.65)',
            margin: 0, textAlign: 'center',
            letterSpacing: '-0.01em',
          }}
        >
          {MESSAGES[idx]}
        </motion.p>
      </AnimatePresence>
    </div>
  )
}

// ─── CardInBox — each card lifts up and cycles through ───────────────────────

function CardInBox({ icon: Icon, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.85 }}
      animate={{
        opacity:    [0, 1,    1,    0   ],
        y:          [20, -12, -12,  -90 ],
        scale:      [0.85, 1,  1,   0.75],
      }}
      transition={{
        duration: 1.3,
        delay,
        times: [0, 0.12, 0.65, 1],
        ease: 'easeInOut',
      }}
      style={{
        position: 'absolute',
        width: 120, height: 120,
        borderRadius: 20,
        background: 'rgba(255,255,255,0.09)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.18)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      }}
    >
      <Icon size={48} color="rgba(255,255,255,0.82)" strokeWidth={1.5} />
    </motion.div>
  )
}

// ─── Stat cards — shown after cards phase, before slide up ───────────────────

function StatCards({ level, dailyGoal, totalUnits }) {
  const daysToMastery = Math.ceil(totalUnits)
  const items = [
    { icon: GraduationCap, label: 'Your Level',       value: level,                    accent: '#8b1a2e' },
    { icon: Clock,          label: 'Daily Goal',       value: `${dailyGoal} min/day`,   accent: '#c9963a' },
    { icon: Map,            label: 'Total Sessions',   value: `${totalUnits} sessions`, accent: '#1D9E75' },
    { icon: Zap,            label: 'Est. to Mastery',  value: `${daysToMastery} days`,  accent: '#8b1a2e' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 320 }}>
      {items.map(({ icon: Icon, label, value, accent }, i) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: i * 0.1, ease: [0.4, 0, 0.2, 1] }}
          style={{
            display: 'flex', alignItems: 'center', gap: 14,
            background: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(12px)',
            border: '0.5px solid rgba(255,255,255,0.14)',
            borderRadius: 14, padding: '13px 16px',
          }}
        >
          <div style={{
            width: 38, height: 38, borderRadius: 10, flexShrink: 0,
            background: accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 2px 8px ${accent}55`,
          }}>
            <Icon size={18} color="#fff" strokeWidth={2} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>
              {label}
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', fontFamily: 'Georgia, serif', letterSpacing: '-0.2px' }}>
              {value}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar() {
  return (
    <div style={{ width: '100%', maxWidth: 320 }}>
      <div style={{
        height: 2, background: 'rgba(255,255,255,0.12)',
        borderRadius: 2, overflow: 'hidden',
      }}>
        <motion.div
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 3.5, ease: [0.4, 0, 0.2, 1] }}
          style={{ height: '100%', background: '#c9963a', borderRadius: 2 }}
        />
      </div>
    </div>
  )
}

// ─── JourneyAnimation ─────────────────────────────────────────────────────────

export function JourneyAnimation({
  level      = 'Intermediate',
  dailyGoal  = 10,
  totalUnits = 138,
  onAnimationComplete,
}) {
  const [phase,   setPhase]   = useState('logo')  // logo | cards | stats | ready | exit
  const [exiting, setExiting] = useState(false)

  const CARDS = [
    { icon: GraduationCap, delay: 0    },
    { icon: Clock,          delay: 1.3  },
    { icon: Map,            delay: 2.6  },
    { icon: Zap,            delay: 3.9  },
  ]

  useEffect(() => {
    let timers = []

    if (phase === 'logo') {
      timers.push(setTimeout(() => setPhase('cards'), 900))
    }
    if (phase === 'cards') {
      timers.push(setTimeout(() => setPhase('stats'), 5400))
    }
    if (phase === 'stats') {
      timers.push(setTimeout(() => setPhase('ready'), 1800))
    }
    if (phase === 'ready') {
      timers.push(setTimeout(() => {
        setExiting(true)
        timers.push(setTimeout(() => {
          onAnimationComplete?.()
        }, 700))
      }, 1200))
    }

    return () => timers.forEach(clearTimeout)
  }, [phase])

  return (
    <motion.div
      animate={exiting ? { y: '-100%' } : { y: 0 }}
      transition={{ duration: 0.65, ease: [0.4, 0, 0.2, 1] }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'linear-gradient(160deg, #2a0710 0%, #8b1a2e 50%, #3d0a15 100%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '32px 24px', overflow: 'hidden',
      }}
    >
      {/* Ambient orb */}
      <div style={{
        position: 'absolute', top: '15%', left: '50%',
        transform: 'translateX(-50%)',
        width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(201,150,58,0.08) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        width: '100%', maxWidth: 360,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 28,
      }}>

        <AnimatePresence mode="wait">

          {/* ── Phase 1: Logo ── */}
          {phase === 'logo' && (
            <motion.div
              key="logo"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
              style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}
            >
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  width: 68, height: 68, borderRadius: 20,
                  background: 'rgba(255,255,255,0.1)',
                  border: '0.5px solid rgba(255,255,255,0.18)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <span style={{ color: '#fff', fontWeight: 900, fontSize: 32, fontFamily: 'Georgia, serif' }}>
                  V
                </span>
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                style={{ fontSize: 18, fontWeight: 600, color: '#fff', margin: 0, fontFamily: 'Georgia, serif' }}
              >
                Setting up your journey
              </motion.p>
            </motion.div>
          )}

          {/* ── Phase 2: Cards shuffling ── */}
          {phase === 'cards' && (
            <motion.div
              key="cards"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32, width: '100%' }}
            >
              {/* Folder box */}
              <div style={{
                position: 'relative',
                width: 280, height: 220,
                perspective: '1200px',
              }}>
                {/* Back wall of folder */}
                <div style={{
                  position: 'absolute', inset: 0,
                  borderRadius: 24,
                  background: 'linear-gradient(145deg, rgba(160,26,42,0.6) 0%, rgba(122,21,34,0.7) 100%)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 24px 64px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
                  transform: 'translateZ(60px)',
                }} />

                {/* Bottom depth */}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  height: 60,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.35), transparent)',
                  borderRadius: '0 0 24px 24px',
                  transform: 'rotateX(75deg) translateY(100%)',
                  transformOrigin: 'center bottom',
                }} />

                {/* Card carousel */}
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {CARDS.map((card, i) => (
                    <CardInBox key={i} icon={card.icon} delay={card.delay} />
                  ))}
                </div>
              </div>

              <StatusMessage />
            </motion.div>
          )}

          {/* ── Phase 3: Stat cards ── */}
          {phase === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, width: '100%' }}
            >
              <StatCards level={level} dailyGoal={dailyGoal} totalUnits={totalUnits} />
              <StatusMessage />
            </motion.div>
          )}

          {/* ── Phase 4: Ready ── */}
          {phase === 'ready' && (
            <motion.div
              key="ready"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, width: '100%' }}
            >
              <StatCards level={level} dailyGoal={dailyGoal} totalUnits={totalUnits} />

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                style={{
                  fontSize: 18, fontWeight: 700, color: '#c9963a',
                  margin: 0, letterSpacing: '-0.01em',
                }}
              >
                Your path is ready
              </motion.p>

              <ProgressBar />
            </motion.div>
          )}

        </AnimatePresence>

      </div>
    </motion.div>
  )
}
