import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Lock, Play, CheckCircle, Flame } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'

/**
 * Roadmap
 * 
 * Duolingo-style vertical path showing sessions (units).
 * Each session = one session worth of words.
 * 
 * States:
 *   - locked: not unlocked yet
 *   - active: next session to do (blue, clickable)
 *   - complete: finished (teal with checkmark)
 * 
 * Every 5th session is a story session (purple, different icon)
 */
export function Roadmap() {
  const { profile } = useAuthStore()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  // For MVP, generate mock sessions
  // TODO: Fetch from DB (units + user_units tables)
  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      const mockSessions = Array.from({ length: 138 }, (_, i) => ({
        id: i + 1,
        sessionNumber: i + 1,
        isStory: (i + 1) % 5 === 0, // Every 5th is story
        state: i === 0 ? 'active' : i > 0 ? 'locked' : 'complete', // First is active
        xpReward: (i + 1) % 5 === 0 ? 75 : 50, // Story sessions = 75 XP
      }))
      setSessions(mockSessions)
      setLoading(false)
    }, 800)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100svh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--c-bg-off)',
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            border: '3px solid var(--c-border)',
            borderTopColor: 'var(--c-primary)',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: '100svh',
        background: 'var(--c-bg-off)',
        padding: '24px 16px',
        paddingBottom: '120px',
      }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          maxWidth: 600,
          margin: '0 auto 40px',
        }}
      >
        <h1
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: 'var(--c-text)',
            margin: '0 0 8px 0',
            fontFamily: 'Georgia, serif',
          }}
        >
          Your learning path
        </h1>
        <p
          style={{
            fontSize: 15,
            color: 'var(--c-text-muted)',
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          {profile?.level} level • {profile?.daily_goal || 10} min/day • {sessions.length} sessions total
        </p>
      </motion.div>

      {/* Sessions path (vertical line with bubbles) */}
      <div
        style={{
          maxWidth: 600,
          margin: '0 auto',
          position: 'relative',
        }}
      >
        {/* Vertical connector line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 20,
            bottom: 0,
            width: 2,
            background: 'var(--c-border)',
            zIndex: 0,
          }}
        />

        {/* Sessions grid */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {sessions.map((session, idx) => {
            const isActive = session.state === 'active'
            const isComplete = session.state === 'complete'
            const isLocked = session.state === 'locked'

            return (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.3,
                  delay: Math.min(idx * 0.02, 0.4), // Cap delay at 0.4s for long lists
                }}
                style={{
                  marginBottom: 20,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 16,
                }}
              >
                {/* Bubble */}
                <motion.button
                  whileTap={isActive ? { scale: 0.95 } : {}}
                  disabled={!isActive}
                  style={{
                    flexShrink: 0,
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    border: isComplete ? 'none' : '2px solid',
                    borderColor: isActive
                      ? 'var(--c-primary)'
                      : isComplete
                      ? 'transparent'
                      : 'var(--c-border)',
                    background: isComplete
                      ? 'var(--c-success)'
                      : isActive
                      ? 'var(--c-primary)'
                      : 'var(--c-bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: isActive ? 'pointer' : 'default',
                    transition: 'all 0.2s ease',
                    boxShadow: isActive ? 'var(--shadow-md)' : 'none',
                  }}
                >
                  {isComplete ? (
                    <CheckCircle size={24} color="#fff" fill="currentColor" strokeWidth={2} />
                  ) : isActive ? (
                    <Play size={20} color="#fff" fill="#fff" strokeWidth={2} />
                  ) : isLocked ? (
                    <Lock size={20} color="var(--c-text-muted)" strokeWidth={2} />
                  ) : null}
                </motion.button>

                {/* Card */}
                <motion.div
                  whileHover={isActive ? { y: -2 } : {}}
                  style={{
                    flex: 1,
                    background: isActive
                      ? 'var(--c-primary-pale)'
                      : isComplete
                      ? 'var(--c-success-pale)'
                      : 'var(--c-bg)',
                    border: isActive
                      ? '2px solid var(--c-primary)'
                      : isComplete
                      ? '1.5px solid var(--c-success)'
                      : '1.5px solid var(--c-border)',
                    borderRadius: 'var(--r-card)',
                    padding: '16px 18px',
                    cursor: isActive ? 'pointer' : 'default',
                    transition: 'all 0.2s ease',
                    opacity: isLocked ? 0.6 : 1,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}
                  >
                    {/* Left: Title */}
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color:
                            isActive
                              ? 'var(--c-primary)'
                              : isComplete
                              ? 'var(--c-success)'
                              : 'var(--c-text-muted)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          marginBottom: 4,
                        }}
                      >
                        {session.isStory ? '📖 Story' : 'Session'} {session.sessionNumber}
                      </div>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: 'var(--c-text)',
                        }}
                      >
                        {session.isStory
                          ? 'Story Mode'
                          : `${
                              profile?.daily_goal || 10
                            } words to learn`}
                      </div>
                      {isComplete && (
                        <div
                          style={{
                            fontSize: 12,
                            color: 'var(--c-text-muted)',
                            marginTop: 4,
                          }}
                        >
                          +{session.xpReward} XP
                        </div>
                      )}
                    </div>

                    {/* Right: XP badge or icon */}
                    {!isComplete && isActive && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 12,
                          fontWeight: 700,
                          color: 'var(--c-primary)',
                          background: 'rgba(139, 26, 46, 0.1)',
                          padding: '4px 10px',
                          borderRadius: 99,
                        }}
                      >
                        <Flame size={14} strokeWidth={2} />
                        {session.xpReward} XP
                      </div>
                    )}
                  </div>

                  {isActive && (
                    <motion.div
                      animate={{ x: [0, 4, 0] }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        repeatType: 'loop',
                      }}
                      style={{
                        fontSize: 12,
                        color: 'var(--c-primary)',
                        marginTop: 8,
                      }}
                    >
                      Start now →
                    </motion.div>
                  )}
                </motion.div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Footer note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        style={{
          maxWidth: 600,
          margin: '60px auto 0',
          padding: '20px',
          background: 'var(--c-bg)',
          border: '1px solid var(--c-border)',
          borderRadius: 'var(--r-card)',
          textAlign: 'center',
          fontSize: 13,
          color: 'var(--c-text-muted)',
          lineHeight: 1.6,
        }}
      >
        Every 5th session is a Story Mode — read engaging passages and answer comprehension questions.
        Unlock the next session by completing the current one.
      </motion.div>
    </div>
  )
}
