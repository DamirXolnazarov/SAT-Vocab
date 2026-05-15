import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { GraduationCap, Clock, Map, Zap } from 'lucide-react'

/**
 * JourneyAnimation
 * 
 * Full-screen "preparing your journey" animation.
 * Shows: Logo pulse → Stat cards shuffle → Progress bar fill → Slide up reveal
 * 
 * Props:
 *   level: "Beginner" | "Intermediate" | "Advanced"
 *   dailyGoal: 5 | 10 | 15 | 20 | 30 (minutes)
 *   totalUnits: number (e.g., 138)
 *   onAnimationComplete: () => void (called when animation finishes, goes to roadmap)
 */
export function JourneyAnimation({
  level = 'Intermediate',
  dailyGoal = 10,
  totalUnits = 138,
  onAnimationComplete,
}) {
  const [phase, setPhase] = useState('start') // start | cards | progress | complete

  // Auto-advance phases
  useEffect(() => {
    if (phase === 'start') {
      const timer = setTimeout(() => setPhase('cards'), 1000)
      return () => clearTimeout(timer)
    }
    if (phase === 'cards') {
      const timer = setTimeout(() => setPhase('progress'), 1500)
      return () => clearTimeout(timer)
    }
    if (phase === 'progress') {
      const timer = setTimeout(() => setPhase('complete'), 800)
      return () => clearTimeout(timer)
    }
  }, [phase])

  // Stat cards to shuffle
  const statCards = [
    {
      icon: GraduationCap,
      label: 'Your Level',
      value: level,
      color: '#8b1a2e',
    },
    {
      icon: Clock,
      label: 'Daily Commitment',
      value: `${dailyGoal} minutes`,
      color: '#c9963a',
    },
    {
      icon: Map,
      label: 'Total Sessions',
      value: totalUnits,
      color: '#1D9E75',
    },
    {
      icon: Zap,
      label: 'Goal Timeline',
      value: `${Math.ceil(totalUnits / (dailyGoal / 5))} days`,
      color: '#8b1a2e',
    },
  ]

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, #8b1a2e 0%, #5c111e 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        overflow: 'hidden',
        zIndex: 9999,
      }}
    >
      {/* ── PHASE 1: Logo & Tagline ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={phase === 'start' ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          textAlign: 'center',
          position: 'absolute',
          width: '100%',
        }}
      >
        <motion.div
          animate={phase === 'start' ? { scale: [1, 1.1, 1] } : { scale: 1 }}
          transition={{
            duration: 0.8,
            repeat: phase === 'start' ? 2 : 0,
            repeatType: 'loop',
          }}
          style={{
            width: 64,
            height: 64,
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            backdropFilter: 'blur(10px)',
          }}
        >
          <span
            style={{
              color: '#fff',
              fontSize: 32,
              fontWeight: 900,
              fontFamily: 'Georgia, serif',
            }}
          >
            V
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={phase === 'start' ? { opacity: 1, y: 0 } : { opacity: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: '#fff',
            margin: 0,
            fontFamily: 'Georgia, serif',
          }}
        >
          Setting up your journey
        </motion.h1>
      </motion.div>

      {/* ── PHASE 2: Stat Cards (Folder contents) ── */}
      <motion.div
        initial={{ opacity: 0, perspective: 1000 }}
        animate={phase === 'cards' || phase === 'progress' || phase === 'complete' ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          width: '100%',
          maxWidth: 320,
          position: 'absolute',
        }}
      >
        {/* Folder visual (subtle) */}
        <motion.div
          initial={{ rotateX: 0 }}
          animate={phase === 'cards' ? { rotateX: -15 } : { rotateX: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            perspective: 1000,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: '100%',
              height: 4,
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: 2,
              marginBottom: 12,
            }}
          />
        </motion.div>

        {/* Cards shuffle in */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {statCards.map((card, idx) => {
            const Icon = card.icon
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20, x: (idx % 2 === 0 ? -1 : 1) * 30 }}
                animate={
                  phase === 'cards' || phase === 'progress' || phase === 'complete'
                    ? { opacity: 1, y: 0, x: 0 }
                    : { opacity: 0, y: 20 }
                }
                transition={{
                  duration: 0.4,
                  delay: phase === 'cards' ? idx * 0.15 : 0,
                  ease: 'easeOut',
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 16,
                  padding: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: card.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={20} color="#fff" strokeWidth={2.5} />
                </div>

                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'rgba(255, 255, 255, 0.6)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: 3,
                    }}
                  >
                    {card.label}
                  </div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: '#fff',
                      fontFamily: 'Georgia, serif',
                    }}
                  >
                    {card.value}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* ── PHASE 3: Progress Bar & Text ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={phase === 'progress' || phase === 'complete' ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          width: '100%',
          maxWidth: 320,
          textAlign: 'center',
          position: 'absolute',
          bottom: 120,
        }}
      >
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={phase === 'progress' ? { opacity: 1, y: 0 } : { opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: '#fff',
            margin: '0 0 16px 0',
            fontFamily: 'Georgia, serif',
          }}
        >
          Your path is ready
        </motion.h2>

        <motion.div
          style={{
            height: 3,
            background: 'rgba(255, 255, 255, 0.15)',
            borderRadius: 2,
            overflow: 'hidden',
            marginBottom: 12,
          }}
        >
          <motion.div
            initial={{ width: '0%' }}
            animate={phase === 'progress' || phase === 'complete' ? { width: '100%' } : { width: '0%' }}
            transition={{
              duration: 1.2,
              ease: 'easeInOut',
            }}
            style={{
              height: '100%',
              background: '#c9963a',
            }}
          />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={phase === 'progress' ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          style={{
            fontSize: 13,
            color: 'rgba(255, 255, 255, 0.7)',
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          Vocabook is arranging your sessions. This won't take long.
        </motion.p>
      </motion.div>

      {/* ── PHASE 4: Slide up & reveal (happens in parent) ── */}
      {phase === 'complete' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          onAnimationComplete={() => {
            setTimeout(() => {
              onAnimationComplete?.()
            }, 300)
          }}
          style={{
            width: '100%',
          }}
        />
      )}
    </div>
  )
}
