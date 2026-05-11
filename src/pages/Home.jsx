import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap, Flame, BookOpen, Target, TrendingUp,
  Bell, ChevronRight, Star, Shield, Calendar,
  BarChart2, Award, Clock, RefreshCw
} from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useUserStore, getLevel, getLevelProgress } from '../stores/userStore'
import { ComebackScreen, useComeback } from '../components/ComebackScreen'
import { DailyQuests } from './DailyQuests'

// ─── Constants ────────────────────────────────────────────────────────────────

const AVATARS = [
  '🦁','🐯','🦊','🐺','🐻','🦋',
  '🐉','🦅','🌟','⚡','🎯','🔥',
  '💎','🚀','🌊','🏔️','🌙','☀️','🎪','🎭',
]

function getSATRange(pct) {
  if (pct >= 90) return { range: '700–800', color: 'var(--c-success)'  }
  if (pct >= 70) return { range: '600–700', color: 'var(--c-primary)'  }
  if (pct >= 40) return { range: '500–600', color: 'var(--c-warning)'  }
  return                { range: '400–500', color: 'var(--c-danger)'   }
}

function getSATReadiness(words) {
  if (!words.length) return 0
  const mastered   = words.filter(w => w.state === 'mastered').length
  const avgMastery = words.reduce((s, w) => s + (w.mastery_score || 0), 0) / words.length
  return Math.round((mastered / words.length) * 60 + (avgMastery / 100) * 40)
}

// ─── Word of the day card ─────────────────────────────────────────────────────

const WORD_OF_DAY = {
  word:     'Perspicacious',
  pos:      'adjective',
  def:      'Having a ready insight into things; shrewd and discerning.',
  example:  'Her perspicacious analysis revealed flaws others had missed entirely.',
}

function WordOfDayCard({ navigate }) {
  const [revealed, setRevealed] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      style={{
        background: 'linear-gradient(135deg, var(--c-primary-dark) 0%, var(--c-primary) 100%)',
        borderRadius: 'var(--r-card)',
        padding: '20px',
        marginBottom: 16,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Orb decoration */}
      <div style={{
        position: 'absolute', top: -30, right: -30,
        width: 130, height: 130, borderRadius: '50%',
        background: 'rgba(255,255,255,0.05)',
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Calendar size={13} color="rgba(255,255,255,0.5)" />
          <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Word of the Day
          </span>
        </div>
        <span style={{
          fontSize: 10, fontWeight: 600,
          background: 'rgba(255,255,255,0.12)',
          color: 'rgba(255,255,255,0.7)',
          padding: '3px 10px', borderRadius: 99,
        }}>
          {WORD_OF_DAY.pos}
        </span>
      </div>

      <div style={{
        fontSize: 28, fontWeight: 900, color: '#fff',
        fontFamily: 'Georgia, serif', letterSpacing: '-0.3px', marginBottom: 6,
      }}>
        {WORD_OF_DAY.word}
      </div>

      <AnimatePresence mode="wait">
        {revealed ? (
          <motion.div
            key="revealed"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, marginBottom: 10 }}>
              {WORD_OF_DAY.def}
            </p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', fontStyle: 'italic', lineHeight: 1.5, marginBottom: 16 }}>
              "{WORD_OF_DAY.example}"
            </p>
            <button
              onClick={() => navigate('/word-of-day')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: '#fff', color: 'var(--c-primary)',
                border: 'none', borderRadius: 'var(--r-sm)',
                padding: '9px 18px', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', width: '100%',
                justifyContent: 'center',
              }}
            >
              Study this word
              <ChevronRight size={14} />
            </button>
          </motion.div>
        ) : (
          <motion.button
            key="hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setRevealed(true)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              width: '100%', padding: '10px 0',
              background: 'rgba(255,255,255,0.12)',
              border: '1.5px solid rgba(255,255,255,0.2)',
              borderRadius: 'var(--r-sm)',
              color: '#fff', fontSize: 13, fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <BookOpen size={14} />
            Reveal definition
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Stat tile ────────────────────────────────────────────────────────────────

function StatTile({ icon, value, label, delay = 0, highlight = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      style={{
        flex: 1,
        background: highlight ? 'var(--c-primary-pale)' : 'var(--c-bg)',
        border: `1px solid ${highlight ? 'rgba(139,26,46,0.15)' : 'var(--c-border)'}`,
        borderRadius: 'var(--r-card)',
        padding: '14px 10px',
        textAlign: 'center',
      }}
    >
      <div style={{
        width: 32, height: 32, borderRadius: 8, margin: '0 auto 8px',
        background: highlight ? 'var(--c-primary)' : 'var(--c-bg-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </div>
      <div style={{
        fontSize: 20, fontWeight: 800, lineHeight: 1,
        color: highlight ? 'var(--c-primary)' : 'var(--c-text)',
        marginBottom: 4,
      }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: 'var(--c-text-muted)', fontWeight: 500 }}>
        {label}
      </div>
    </motion.div>
  )
}

// ─── Level bar ────────────────────────────────────────────────────────────────

function LevelBar({ xp }) {
  const level    = getLevel(xp)
  const progress = getLevelProgress(xp)
  const xpToNext = level.max !== Infinity ? level.max + 1 - xp : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      style={{
        background: 'var(--c-bg)',
        border: '1px solid var(--c-border)',
        borderRadius: 'var(--r-card)',
        padding: '14px 16px',
        marginBottom: 16,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'var(--c-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Award size={14} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-text)' }}>
              {level.label}
            </div>
            <div style={{ fontSize: 11, color: 'var(--c-text-muted)' }}>
              {xp.toLocaleString()} XP total
            </div>
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>
          {xpToNext !== null ? `${xpToNext.toLocaleString()} to next` : 'Max level'}
        </div>
      </div>

      <div style={{ height: 6, background: 'var(--c-border)', borderRadius: 3, overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.9, ease: 'easeOut', delay: 0.3 }}
          style={{ height: '100%', background: 'var(--c-primary)', borderRadius: 3 }}
        />
      </div>
    </motion.div>
  )
}

// ─── Daily goal card ──────────────────────────────────────────────────────────

function DailyGoalCard({ profile, words }) {
  const goal     = profile?.daily_goal || 10
  const today    = new Date().toISOString().split('T')[0]
  const done     = words.filter(w => w.last_reviewed_at?.startsWith(today)).length
  const pct      = Math.min(100, Math.round((done / goal) * 100))
  const complete = pct >= 100

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      style={{
        background: 'var(--c-bg)',
        border: '1px solid var(--c-border)',
        borderRadius: 'var(--r-card)',
        padding: '16px',
        marginBottom: 16,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Target size={16} color="var(--c-primary)" />
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-text)' }}>Daily goal</span>
        </div>
        <span style={{
          fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
          background: complete ? 'var(--c-success-pale)' : 'var(--c-primary-pale)',
          color: complete ? 'var(--c-success)' : 'var(--c-primary)',
        }}>
          {done}/{goal} words
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ height: 7, background: 'var(--c-border)', borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.4 }}
          style={{
            height: '100%', borderRadius: 4,
            background: complete ? 'var(--c-success)' : 'var(--c-primary)',
          }}
        />
      </div>

      {/* Dots */}
      <div style={{ display: 'flex', gap: 3 }}>
        {Array.from({ length: Math.min(goal, 20) }, (_, i) => (
          <div
            key={i}
            style={{
              flex: 1, height: 4, borderRadius: 2,
              background: i < done ? 'var(--c-primary)' : 'var(--c-border)',
              transition: 'background 0.3s ease',
            }}
          />
        ))}
      </div>
    </motion.div>
  )
}

// ─── SAT readiness card ───────────────────────────────────────────────────────

function ReadinessCard({ words }) {
  const score    = getSATReadiness(words)
  const mastered = words.filter(w => w.state === 'mastered').length
  const total    = words.length
  const pct      = total > 0 ? Math.round((mastered / total) * 100) : 0
  const sat      = getSATRange(pct)

  const r    = 28
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      style={{
        background: 'var(--c-bg)',
        border: '1px solid var(--c-border)',
        borderRadius: 'var(--r-card)',
        padding: '16px',
        marginBottom: 16,
        display: 'flex', alignItems: 'center', gap: 16,
      }}
    >
      {/* Ring */}
      <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
        <svg width="72" height="72" viewBox="0 0 72 72">
          <circle cx="36" cy="36" r={r} fill="none" stroke="var(--c-border)" strokeWidth="5" />
          <motion.circle
            cx="36" cy="36" r={r}
            fill="none" stroke={sat.color} strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ - dash }}
            transition={{ duration: 1.1, ease: 'easeOut', delay: 0.4 }}
            transform="rotate(-90 36 36)"
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 17, fontWeight: 800, color: sat.color, lineHeight: 1 }}>{score}</span>
          <span style={{ fontSize: 9, color: 'var(--c-text-muted)' }}>/100</span>
        </div>
      </div>

      {/* Info */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <TrendingUp size={14} color="var(--c-text-muted)" />
          <span style={{ fontSize: 12, color: 'var(--c-text-muted)', fontWeight: 500 }}>
            SAT Readiness
          </span>
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--c-text)', marginBottom: 6 }}>
          Predicted range
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: sat.color + '18',
          border: `1px solid ${sat.color}40`,
          borderRadius: 99, padding: '4px 12px',
        }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: sat.color }} />
          <span style={{ fontSize: 15, fontWeight: 800, color: sat.color }}>
            {sat.range}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Quick actions ────────────────────────────────────────────────────────────

function QuickActions({ navigate, wordCount }) {
  const actions = [
    {
      icon: <Zap size={18} color="#fff" />,
      label: 'Start session',
      sub: 'Learn new words',
      primary: true,
      onClick: () => navigate('/learn'),
    },
    {
      icon: <BookOpen size={18} color="var(--c-primary)" />,
      label: 'Vocab bank',
      sub: `${wordCount} words`,
      primary: false,
      onClick: () => navigate('/learn?tab=bank'),
    },
    {
      icon: <BarChart2 size={18} color="var(--c-primary)" />,
      label: 'My stats',
      sub: 'View progress',
      primary: false,
      onClick: () => navigate('/stats'),
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      style={{ marginBottom: 16 }}
    >
      <div style={{
        fontSize: 11, fontWeight: 600, letterSpacing: '0.07em',
        color: 'var(--c-text-muted)', textTransform: 'uppercase',
        marginBottom: 10,
      }}>
        Quick actions
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {actions.map(({ icon, label, sub, primary, onClick }) => (
          <motion.button
            key={label}
            whileTap={{ scale: 0.985 }}
            onClick={onClick}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 16px',
              background: primary ? 'var(--c-primary)' : 'var(--c-bg)',
              border: primary ? 'none' : '1px solid var(--c-border)',
              borderRadius: 'var(--r-card)',
              cursor: 'pointer', textAlign: 'left',
              boxShadow: primary ? 'var(--shadow-md)' : 'none',
              transition: 'opacity 0.15s ease',
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 10, flexShrink: 0,
              background: primary ? 'rgba(255,255,255,0.15)' : 'var(--c-primary-pale)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 14, fontWeight: 600, marginBottom: 1,
                color: primary ? '#fff' : 'var(--c-text)',
              }}>
                {label}
              </div>
              <div style={{ fontSize: 12, color: primary ? 'rgba(255,255,255,0.6)' : 'var(--c-text-muted)' }}>
                {sub}
              </div>
            </div>
            <ChevronRight size={16} color={primary ? 'rgba(255,255,255,0.4)' : 'var(--c-text-muted)'} />
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}

// ─── Vocab breakdown ──────────────────────────────────────────────────────────

function VocabBreakdown({ words }) {
  if (!words.length) return null

  const states = [
    { key: 'mastered',   label: 'Mastered',   color: 'var(--c-state-mastered)',       bg: 'var(--c-state-mastered-bg)'   },
    { key: 'learning',   label: 'Learning',   color: 'var(--c-state-learning)',       bg: 'var(--c-state-learning-bg)'   },
    { key: 'struggling', label: 'Struggling', color: 'var(--c-state-struggling)',     bg: 'var(--c-state-struggling-bg)' },
    { key: 'new',        label: 'New',        color: 'var(--c-state-new)',            bg: 'var(--c-state-new-bg)'        },
  ]
  const counts = Object.fromEntries(
    states.map(s => [s.key, words.filter(w => w.state === s.key).length])
  )
  const total = words.length

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      style={{
        background: 'var(--c-bg)',
        border: '1px solid var(--c-border)',
        borderRadius: 'var(--r-card)',
        padding: '16px',
        marginBottom: 16,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Shield size={15} color="var(--c-primary)" />
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-text)' }}>Vocabulary</span>
        </div>
        <span style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>{total} words</span>
      </div>

      {/* Stacked bar */}
      <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 14 }}>
        {states.map(({ key, color }) => {
          const pct = total > 0 ? (counts[key] / total) * 100 : 0
          return pct > 0 ? (
            <motion.div
              key={key}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.5 }}
              style={{ height: '100%', background: color }}
            />
          ) : null
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {states.map(({ key, label, color }) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: 'var(--c-text-muted)', flex: 1 }}>{label}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-text)' }}>
              {counts[key]}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// ─── Home page ────────────────────────────────────────────────────────────────

export function Home() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { words, fetchWords } = useUserStore()
  const { show: showComeback, dismiss: dismissComeback } = useComeback()

  useEffect(() => {
    if (profile?.id) fetchWords(profile.id)
  }, [profile?.id])

  const xp      = profile?.total_xp || 0
  const streak  = profile?.current_streak || 0
  const mastered = words.filter(w => w.state === 'mastered').length

  // Greeting
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div style={{ paddingTop: 20, paddingBottom: 8 }}>

      {/* Comeback screen */}
      <AnimatePresence>
        {showComeback && <ComebackScreen onDismiss={dismissComeback} />}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: 20,
        }}
      >
        <div>
          <div style={{ fontSize: 13, color: 'var(--c-text-muted)' }}>{greeting},</div>
          <div style={{
            fontSize: 22, fontWeight: 800, color: 'var(--c-text)',
            letterSpacing: '-0.3px', lineHeight: 1.2,
          }}>
            {profile?.username || 'Learner'}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Streak badge */}
          {streak > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'var(--c-gold-pale)',
              border: '1px solid var(--c-gold-light)',
              borderRadius: 99, padding: '5px 12px',
            }}>
              <Flame size={14} color="var(--c-gold)" />
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--c-gold)' }}>
                {streak}
              </span>
            </div>
          )}

          {/* Notification bell */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => navigate('/notifications')}
            style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'var(--c-bg)',
              border: '1px solid var(--c-border)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Bell size={18} color="var(--c-text-muted)" />
          </motion.button>
        </div>
      </motion.div>

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        style={{ display: 'flex', gap: 10, marginBottom: 16 }}
      >
        <StatTile
          icon={<Zap size={15} color="var(--c-primary)" />}
          value={xp.toLocaleString()}
          label="Total XP"
          delay={0.08}
          highlight
        />
        <StatTile
          icon={<Flame size={15} color="var(--c-gold)" />}
          value={streak}
          label="Day streak"
          delay={0.12}
        />
        <StatTile
          icon={<Star size={15} color="var(--c-success)" />}
          value={mastered}
          label="Mastered"
          delay={0.16}
        />
      </motion.div>

      {/* Level bar */}
      <LevelBar xp={xp} />

      {/* Daily goal */}
      <DailyGoalCard profile={profile} words={words} />

      {/* Word of day */}
      <WordOfDayCard navigate={navigate} />

      {/* Quick actions */}
      <QuickActions navigate={navigate} wordCount={words.length} />

      {/* SAT readiness */}
      {words.length >= 5 && <ReadinessCard words={words} />}

      {/* Vocab breakdown */}
      <VocabBreakdown words={words} />

      {/* Daily quests */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        style={{
          background: 'var(--c-bg)',
          border: '1px solid var(--c-border)',
          borderRadius: 'var(--r-card)',
          padding: '16px',
          marginBottom: 16,
        }}
      >
        <DailyQuests />
      </motion.div>

      {/* Empty state */}
      {words.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{
            textAlign: 'center', padding: '28px 20px',
            background: 'var(--c-bg)',
            border: '1px dashed var(--c-border)',
            borderRadius: 'var(--r-card)',
          }}
        >
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'var(--c-primary-pale)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px',
          }}>
            <BookOpen size={22} color="var(--c-primary)" />
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--c-text)', marginBottom: 6 }}>
            No words yet
          </div>
          <div style={{ fontSize: 14, color: 'var(--c-text-muted)', marginBottom: 20 }}>
            Add your first SAT words to start learning
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/learn?tab=bank')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '10px 24px',
              background: 'var(--c-primary)', color: '#fff',
              border: 'none', borderRadius: 99,
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <BookOpen size={14} />
            Add words
          </motion.button>
        </motion.div>
      )}
    </div>
  )
}