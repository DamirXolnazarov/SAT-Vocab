import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Lock, Play, CheckCircle, Flame, BookOpen, ChevronRight, Zap } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'

/**
 * Roadmap
 * 
 * Duolingo-style vertical path showing sessions (units).
 * Each session = one session worth of words.
 * 
 * States:
 *   - locked: not unlocked yet
 *   - active: next session to do (blue, clickable)
 *   - completed: finished (teal with checkmark)
 * 
 * Every 5th session is a story session (purple, different icon)
 * Sessions 15, 30, 45, etc. are comprehensive tests
 */
export function Roadmap() {
  const { user, profile } = useAuthStore()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    
    const fetchSessions = async () => {
      try {
        // Fetch all units
        const { data: units, error: unitsError } = await supabase
          .from('units')
          .select('*')
          .order('unit_number', { ascending: true })
        
        if (unitsError) throw unitsError

        // Fetch user's progress on units
        const { data: userUnits, error: userUnitsError } = await supabase
          .from('user_units')
          .select('*')
          .eq('user_id', user.id)
        
        if (userUnitsError) throw userUnitsError

        // Create map of user progress
        const progressMap = Object.fromEntries(
          userUnits?.map(u => [u.unit_id, u]) || []
        )

        // Merge data and determine state
        const sessionData = units.map((unit, idx) => {
          const progress = progressMap[unit.id]
          let state = 'locked'
          
          if (idx === 0) {
            state = 'active' // First is always active
          } else if (progress) {
            state = progress.state // 'locked', 'active', 'completed'
          } else if (idx > 0 && progressMap[units[idx - 1]?.id]?.state === 'completed') {
            state = 'active' // Active if previous is completed
          }

          return {
            id: unit.id,
            sessionNumber: unit.unit_number,
            isStory: unit.is_story_session,
            isTest: unit.is_test_session,
            state,
            xpReward: unit.is_story_session ? 75 : unit.is_test_session ? 100 : 50,
            theme: unit.theme,
          }
        })

        setSessions(sessionData)
      } catch (err) {
        console.error('Error fetching sessions:', err)
        // Fallback to mock data for development
        const mockSessions = Array.from({ length: 138 }, (_, i) => ({
          id: i + 1,
          sessionNumber: i + 1,
          isStory: (i + 1) % 5 === 0,
          isTest: [15, 30, 45, 60, 75, 90, 105, 120, 135].includes(i + 1),
          state: i === 0 ? 'active' : 'locked',
          xpReward: (i + 1) % 5 === 0 ? 75 : 50,
          theme: `Unit ${i + 1}`,
        }))
        setSessions(mockSessions)
      } finally {
        setLoading(false)
      }
    }

    fetchSessions()
  }, [user])

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
            const isComplete = session.state === 'completed'
            const isLocked = session.state === 'locked'
            
            // Slight offset for road curve effect
            const horizontalOffset = Math.sin(idx * 0.1) * 8
            const hasRoadCurve = idx % 3 === 0 // Every 3rd has visible curve

            return (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.3,
                  delay: Math.min(idx * 0.02, 0.4),
                }}
                style={{
                  marginBottom: 24,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 16,
                  marginLeft: `${Math.abs(horizontalOffset)}px`,
                }}
              >
                {/* 3D Station Bubble */}
                <motion.div
                  whileTap={isActive ? { scale: 0.9, rotateY: 10 } : {}}
                  disabled={!isActive}
                  style={{
                    flexShrink: 0,
                    width: 56,
                    height: 56,
                    borderRadius: '12px',
                    perspective: '1000px',
                    cursor: isActive ? 'pointer' : 'default',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '12px',
                      border: isComplete ? 'none' : isActive ? '3px solid var(--c-primary)' : '2px solid var(--c-border)',
                      background: isComplete
                        ? 'linear-gradient(135deg, var(--c-success) 0%, var(--c-state-mastered) 100%)'
                        : isActive
                        ? 'linear-gradient(135deg, var(--c-primary) 0%, rgba(139,26,46,0.8) 100%)'
                        : 'var(--c-bg)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: isActive
                        ? '0 8px 24px rgba(139,26,46,0.3), inset 0 1px 0 rgba(255,255,255,0.3)'
                        : isComplete
                        ? '0 4px 12px rgba(76,175,80,0.2)'
                        : '0 1px 3px rgba(0,0,0,0.1)',
                      transition: 'all 0.2s ease',
                      opacity: isLocked ? 0.5 : 1,
                      position: 'relative',
                    }}
                  >
                    {/* Station number label */}
                    <div style={{
                      position: 'absolute',
                      fontSize: 10,
                      fontWeight: 900,
                      color: isActive ? '#fff' : isComplete ? '#fff' : 'var(--c-text-muted)',
                      top: 4,
                      right: 5,
                      opacity: 0.7,
                    }}>
                      {session.sessionNumber}
                    </div>
                    
                    {/* Center icon */}
                    {isComplete ? (
                      <CheckCircle size={28} color="#fff" fill="currentColor" strokeWidth={1.5} />
                    ) : isActive ? (
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        {session.isStory ? (
                          <BookOpen size={26} color="#fff" fill="rgba(255,255,255,0.2)" strokeWidth={2} />
                        ) : session.isTest ? (
                          <Zap size={26} color="#fff" fill="rgba(255,255,255,0.2)" strokeWidth={2} />
                        ) : (
                          <Play size={24} color="#fff" fill="rgba(255,255,255,0.3)" strokeWidth={2} />
                        )}
                      </motion.div>
                    ) : isLocked ? (
                      <Lock size={24} color="var(--c-text-muted)" strokeWidth={2} />
                    ) : null}
                  </div>
                </motion.div>

                {/* Enhanced Card */}
                <motion.div
                  whileHover={isActive ? { y: -4, boxShadow: '0 12px 32px rgba(139,26,46,0.25)' } : {}}
                  style={{
                    flex: 1,
                    background: isActive
                      ? 'linear-gradient(135deg, var(--c-primary-pale) 0%, rgba(249,232,235,0.5) 100%)'
                      : isComplete
                      ? 'linear-gradient(135deg, var(--c-success-pale) 0%, rgba(225,245,238,0.5) 100%)'
                      : 'var(--c-bg)',
                    border: isActive
                      ? '2px solid var(--c-primary)'
                      : isComplete
                      ? '2px solid var(--c-success)'
                      : '1.5px solid var(--c-border)',
                    borderRadius: 'var(--r-card)',
                    padding: '16px 18px',
                    cursor: isActive ? 'pointer' : 'default',
                    transition: 'all 0.25s ease',
                    opacity: isLocked ? 0.65 : 1,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Decorative corner accent */}
                  {(isActive || isComplete) && (
                    <div style={{
                      position: 'absolute',
                      top: -20,
                      right: -20,
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      background: isActive
                        ? 'rgba(139,26,46,0.08)'
                        : 'rgba(76,175,80,0.08)',
                      pointerEvents: 'none',
                    }} />
                  )}

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    position: 'relative',
                    zIndex: 1,
                  }}>
                    {/* Left: Title & Description */}
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: isActive
                          ? 'var(--c-primary)'
                          : isComplete
                          ? 'var(--c-success)'
                          : 'var(--c-text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: 3,
                      }}>
                        {session.isTest ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <Zap size={13} />
                            Test Milestone
                          </span>
                        ) : session.isStory ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <BookOpen size={13} />
                            Story Mode
                          </span>
                        ) : (
                          `Session ${session.sessionNumber}`
                        )}
                      </div>
                      <div style={{
                        fontSize: 14,
                        fontWeight: 650,
                        color: 'var(--c-text)',
                        marginBottom: 2,
                      }}>
                        {session.isTest
                          ? 'Comprehensive Review'
                          : session.isStory
                          ? 'Story & Comprehension'
                          : `${profile?.daily_goal || 10} words`}
                      </div>
                      {isComplete && (
                        <div style={{
                          fontSize: 11,
                          color: 'var(--c-success)',
                          fontWeight: 600,
                          marginTop: 2,
                        }}>
                          ✓ Completed +{session.xpReward} XP
                        </div>
                      )}
                    </div>

                    {/* Right: XP badge */}
                    {!isComplete && isActive && (
                      <motion.div
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 12,
                          fontWeight: 800,
                          color: '#fff',
                          background: 'var(--c-primary)',
                          padding: '6px 12px',
                          borderRadius: 99,
                          boxShadow: '0 4px 12px rgba(139,26,46,0.25)',
                        }}
                      >
                        <Flame size={13} fill="#fff" strokeWidth={2} />
                        {session.xpReward}
                      </motion.div>
                    )}
                  </div>

                  {/* Call to action */}
                  {isActive && (
                    <motion.div
                      animate={{ x: [0, 6, 0] }}
                      transition={{
                        duration: 1.8,
                        repeat: Infinity,
                        repeatType: 'loop',
                      }}
                      style={{
                        fontSize: 12,
                        color: 'var(--c-primary)',
                        marginTop: 10,
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      Tap to begin
                      <ChevronRight size={14} strokeWidth={3} />
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
