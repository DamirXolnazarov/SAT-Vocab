import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap, Flame, BookOpen, Target, TrendingUp, Bell, ChevronRight,
  Star, Shield, Calendar, BarChart2, Award, Clock, RefreshCw, Play, Sparkles
} from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'

// ─── Current Session Card (Duolingo-style, main focus) ──────────────────────

function CurrentSessionCard({ navigate, currentSession, profile, onStart }) {
  if (!currentSession) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'var(--c-bg)',
          border: '2px dashed var(--c-border)',
          borderRadius: 'var(--r-card)',
          padding: '28px 20px',
          marginBottom: 24,
          textAlign: 'center',
        }}
      >
        <Sparkles size={32} color="var(--c-primary)" style={{ margin: '0 auto 12px' }} />
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--c-text)', marginBottom: 6 }}>
          Journey complete! 🎉
        </div>
        <div style={{ fontSize: 13, color: 'var(--c-text-muted)', marginBottom: 16 }}>
          You've completed all sessions. Amazing effort!
        </div>
        <button
          onClick={() => navigate('/roadmap')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '10px 24px', background: 'var(--c-primary)', color: '#fff',
            border: 'none', borderRadius: 99, fontSize: 14, fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          View roadmap
        </button>
      </motion.div>
    )
  }

  const wordCount = profile?.daily_goal || 10
  const isStory = currentSession.isStory
  const isTest = currentSession.isTest

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      style={{
        background: isTest
          ? 'linear-gradient(135deg, #ff6b6b 0%, #c92a2a 100%)'
          : isStory
          ? 'linear-gradient(135deg, #7950f2 0%, #5e21b6 100%)'
          : 'linear-gradient(135deg, var(--c-primary) 0%, rgba(139,26,46,0.85) 100%)',
        borderRadius: 'var(--r-card)',
        padding: '28px 20px',
        marginBottom: 24,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 12px 40px rgba(139,26,46,0.2)',
        cursor: 'pointer',
      }}
      onClick={onStart}
    >
      {/* Decorative orb */}
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.15, 0.1] }}
        transition={{ duration: 3, repeat: Infinity }}
        style={{
          position: 'absolute',
          top: -40,
          right: -40,
          width: 140,
          height: 140,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
          pointerEvents: 'none',
        }}
      />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Top badge */}
        <div style={{
          fontSize: 11,
          fontWeight: 700,
          color: 'rgba(255,255,255,0.7)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          {isTest ? (
            <>
              <Zap size={13} strokeWidth={3} />
              Test Milestone
            </>
          ) : isStory ? (
            <>
              <BookOpen size={13} strokeWidth={2} />
              Story Mode
            </>
          ) : (
            <>
              <Target size={13} strokeWidth={2} />
              Next Session
            </>
          )}
        </div>

        {/* Title */}
        <div style={{
          fontSize: 32,
          fontWeight: 900,
          color: '#fff',
          marginBottom: 8,
          lineHeight: 1.1,
        }}>
          {isTest
            ? 'Comprehensive Review'
            : isStory
            ? 'Story & Comprehension'
            : `Session ${currentSession.sessionNumber}`}
        </div>

        {/* Description */}
        <div style={{
          fontSize: 15,
          color: 'rgba(255,255,255,0.85)',
          marginBottom: 20,
          lineHeight: 1.5,
        }}>
          {isTest
            ? 'Test your mastery of all words covered so far. Multiple question types.'
            : isStory
            ? 'Read an engaging passage and answer comprehension questions.'
            : `Learn ${wordCount} new SAT vocabulary words with definitions, examples, and mnemonics.`}
        </div>

        {/* CTA Button */}
        <motion.button
          whileHover={{ scale: 1.05, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}
          whileTap={{ scale: 0.98 }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            padding: '14px 32px',
            background: '#fff',
            color: isTest ? '#c92a2a' : isStory ? '#5e21b6' : 'var(--c-primary)',
            border: 'none',
            borderRadius: 99,
            fontSize: 16,
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          }}
        >
          <Play size={18} fill="currentColor" />
          Start now
        </motion.button>

        {/* Bottom info row */}
        <div style={{
          marginTop: 20,
          paddingTop: 16,
          borderTop: '1px solid rgba(255,255,255,0.15)',
          display: 'flex',
          gap: 20,
        }}>
          <div>
            <div style={{
              fontSize: 11,
              color: 'rgba(255,255,255,0.5)',
              textTransform: 'uppercase',
              fontWeight: 600,
              marginBottom: 4,
            }}>
              Est. time
            </div>
            <div style={{
              fontSize: 14,
              fontWeight: 700,
              color: '#fff',
            }}>
              {isTest ? '30 min' : isStory ? '10 min' : '10 min'}
            </div>
          </div>
          <div>
            <div style={{
              fontSize: 11,
              color: 'rgba(255,255,255,0.5)',
              textTransform: 'uppercase',
              fontWeight: 600,
              marginBottom: 4,
            }}>
              XP Reward
            </div>
            <div style={{
              fontSize: 14,
              fontWeight: 700,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}>
              <Flame size={14} fill="#fff" />
              {isTest ? '100' : isStory ? '75' : '50'}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 11,
              color: 'rgba(255,255,255,0.5)',
              textTransform: 'uppercase',
              fontWeight: 600,
              marginBottom: 4,
            }}>
              Progress
            </div>
            <div style={{
              fontSize: 14,
              fontWeight: 700,
              color: '#fff',
            }}>
              {currentSession.sessionNumber}/138
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Quick Stats Row ──────────────────────────────────────────────────────────

function QuickStats({ profile, currentSession }) {
  const streak = profile?.current_streak || 0
  const xp = profile?.xp || 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: 10,
        marginBottom: 20,
      }}
    >
      {/* Streak */}
      <div style={{
        background: 'var(--c-bg)',
        border: '1px solid var(--c-border)',
        borderRadius: 'var(--r-card)',
        padding: '14px',
        textAlign: 'center',
      }}>
        <Flame size={18} color="var(--c-gold)" style={{ margin: '0 auto 6px' }} />
        <div style={{
          fontSize: 18,
          fontWeight: 800,
          color: 'var(--c-text)',
          lineHeight: 1,
          marginBottom: 2,
        }}>
          {streak}
        </div>
        <div style={{ fontSize: 11, color: 'var(--c-text-muted)', fontWeight: 500 }}>
          Day streak
        </div>
      </div>

      {/* XP */}
      <div style={{
        background: 'var(--c-bg)',
        border: '1px solid var(--c-border)',
        borderRadius: 'var(--r-card)',
        padding: '14px',
        textAlign: 'center',
      }}>
        <Zap size={18} color="var(--c-primary)" style={{ margin: '0 auto 6px' }} />
        <div style={{
          fontSize: 18,
          fontWeight: 800,
          color: 'var(--c-text)',
          lineHeight: 1,
          marginBottom: 2,
        }}>
          {xp.toLocaleString()}
        </div>
        <div style={{ fontSize: 11, color: 'var(--c-text-muted)', fontWeight: 500 }}>
          Total XP
        </div>
      </div>

      {/* Next session */}
      <div style={{
        background: 'var(--c-bg)',
        border: '1px solid var(--c-border)',
        borderRadius: 'var(--r-card)',
        padding: '14px',
        textAlign: 'center',
      }}>
        <Target size={18} color="var(--c-success)" style={{ margin: '0 auto 6px' }} />
        <div style={{
          fontSize: 18,
          fontWeight: 800,
          color: 'var(--c-text)',
          lineHeight: 1,
          marginBottom: 2,
        }}>
          {currentSession?.sessionNumber || '0'}
        </div>
        <div style={{ fontSize: 11, color: 'var(--c-text-muted)', fontWeight: 500 }}>
          Session #
        </div>
      </div>
    </motion.div>
  )
}

// ─── Daily Goal Progress ──────────────────────────────────────────────────────

function DailyGoalWidget({ profile }) {
  const goal = profile?.daily_goal || 10
  // TODO: fetch today's completed words count from DB
  const completed = 0

  const pct = Math.min(100, Math.round((completed / goal) * 100))

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      style={{
        background: 'var(--c-bg)',
        border: '1px solid var(--c-border)',
        borderRadius: 'var(--r-card)',
        padding: '14px 16px',
        marginBottom: 16,
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Target size={16} color="var(--c-primary)" />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-text)' }}>
            Today's goal
          </span>
        </div>
        <span style={{
          fontSize: 12,
          fontWeight: 700,
          color: pct >= 100 ? 'var(--c-success)' : 'var(--c-primary)',
          background: pct >= 100 ? 'var(--c-success-pale)' : 'var(--c-primary-pale)',
          padding: '2px 8px',
          borderRadius: 99,
        }}>
          {completed}/{goal}
        </span>
      </div>

      <div style={{ height: 6, background: 'var(--c-border)', borderRadius: 3, overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, delay: 0.3 }}
          style={{
            height: '100%',
            background: pct >= 100 ? 'var(--c-success)' : 'var(--c-primary)',
            borderRadius: 3,
          }}
        />
      </div>
    </motion.div>
  )
}

// ─── Quick Actions ────────────────────────────────────────────────────────────

function QuickLinks({ navigate }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      style={{ marginBottom: 20 }}
    >
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 8,
      }}>
        <button
          onClick={() => navigate('/roadmap')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 14px',
            background: 'var(--c-bg)',
            border: '1px solid var(--c-border)',
            borderRadius: 'var(--r-card)',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--c-text)',
            transition: 'all 0.2s ease',
          }}
          onMouseOver={e => e.currentTarget.style.borderColor = 'var(--c-primary)'}
          onMouseOut={e => e.currentTarget.style.borderColor = 'var(--c-border)'}
        >
          <BookOpen size={14} color="var(--c-primary)" />
          Roadmap
        </button>

        <button
          onClick={() => navigate('/stats')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 14px',
            background: 'var(--c-bg)',
            border: '1px solid var(--c-border)',
            borderRadius: 'var(--r-card)',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--c-text)',
            transition: 'all 0.2s ease',
          }}
          onMouseOver={e => e.currentTarget.style.borderColor = 'var(--c-primary)'}
          onMouseOut={e => e.currentTarget.style.borderColor = 'var(--c-border)'}
        >
          <BarChart2 size={14} color="var(--c-primary)" />
          Stats
        </button>
      </div>
    </motion.div>
  )
}

// ─── Main Home Component ──────────────────────────────────────────────────────

export function Home() {
  const navigate = useNavigate()
  const { user, profile } = useAuthStore()
  const [currentSession, setCurrentSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchCurrentSession = async () => {
      try {
        // Fetch user's active unit
        const { data: userUnits, error: err1 } = await supabase
          .from('user_units')
          .select('unit_id')
          .eq('user_id', user.id)
          .eq('state', 'active')
          .single()

        if (err1 && err1.code !== 'PGRST116') throw err1 // PGRST116 = no row

        if (userUnits) {
          // Fetch unit details
          const { data: unit, error: err2 } = await supabase
            .from('units')
            .select('*')
            .eq('id', userUnits.unit_id)
            .single()

          if (err2) throw err2
          setCurrentSession({
            sessionNumber: unit.unit_number,
            isStory: unit.is_story_session,
            isTest: unit.is_test_session,
          })
        } else {
          // No active unit, fetch first unit
          const { data: units, error: err2 } = await supabase
            .from('units')
            .select('*')
            .order('unit_number', { ascending: true })
            .limit(1)

          if (err2) throw err2
          if (units?.length > 0) {
            const unit = units[0]
            setCurrentSession({
              sessionNumber: unit.unit_number,
              isStory: unit.is_story_session,
              isTest: unit.is_test_session,
            })
          }
        }
      } catch (err) {
        console.error('Error fetching current session:', err)
        // Fallback: first session
        setCurrentSession({
          sessionNumber: 1,
          isStory: false,
          isTest: false,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchCurrentSession()
  }, [user])

  const greeting = (() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  })()

  if (loading) {
    return (
      <div style={{
        minHeight: '100svh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: '3px solid var(--c-border)',
          borderTopColor: 'var(--c-primary)',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  const handleStartSession = () => {
    // Navigate to Learn or appropriate page
    navigate('/learn')
  }

  return (
    <div style={{ paddingTop: 16, paddingBottom: 8 }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <div>
          <div style={{ fontSize: 13, color: 'var(--c-text-muted)', marginBottom: 2 }}>
            {greeting}
          </div>
          <div style={{
            fontSize: 24,
            fontWeight: 800,
            color: 'var(--c-text)',
            letterSpacing: '-0.3px',
          }}>
            {profile?.username || 'Learner'}
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => navigate('/notifications')}
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: 'var(--c-bg)',
            border: '1px solid var(--c-border)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Bell size={18} color="var(--c-text-muted)" />
        </motion.button>
      </motion.div>

      {/* Quick stats */}
      <QuickStats profile={profile} currentSession={currentSession} />

      {/* Current session (main focus) */}
      <CurrentSessionCard
        navigate={navigate}
        currentSession={currentSession}
        profile={profile}
        onStart={handleStartSession}
      />

      {/* Daily goal */}
      <DailyGoalWidget profile={profile} />

      {/* Quick links */}
      <QuickLinks navigate={navigate} />
    </div>
  )
}
