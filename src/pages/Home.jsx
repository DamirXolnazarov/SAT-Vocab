import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '../stores/authStore'
import { useUserStore } from '../stores/userStore'
import { DailyQuests } from './DailyQuests'
import { ComebackScreen, useComeback } from '../components/ComebackScreen'
import { AnimatePresence } from 'framer-motion'
import { WordSearch } from '../components/WordSearch'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const AVATARS = [
  '🦁','🐯','🦊','🐺','🐻','🦋',
  '🐉','🦅','🌟','⚡','🎯','🔥',
  '💎','🚀','🌊','🏔️','🌙','☀️','🎪','🎭',
]

const LEVELS = [
  { label: 'Beginner',     min: 0,    max: 499  },
  { label: 'Learner',      min: 500,  max: 1499 },
  { label: 'Intermediate', min: 1500, max: 3499 },
  { label: 'Advanced',     min: 3500, max: 6999 },
  { label: 'SAT Master',   min: 7000, max: Infinity },
]

function getLevel(xp) {
  return LEVELS.find(l => xp >= l.min && xp <= l.max) || LEVELS[0]
}

function getLevelProgress(xp) {
  const level = getLevel(xp)
  if (level.max === Infinity) return 100
  const range = level.max - level.min
  const progress = xp - level.min
  return Math.round((progress / range) * 100)
}

function getNextLevelXP(xp) {
  const level = getLevel(xp)
  if (level.max === Infinity) return null
  return level.max + 1 - xp
}

// ─── Word of the Day card ─────────────────────────────────────────────────────

const WORD_OF_DAY = {
  word: 'Perspicacious',
  pronunciation: '/ˌpɜːr.spɪˈkeɪ.ʃəs/',
  part_of_speech: 'adjective',
  definition: 'Having a ready insight; shrewd and discerning.',
  example: 'Her perspicacious analysis of the market earned her widespread respect.',
  state: 'new',
}

function WordOfDay({ onStudy }) {
  const [revealed, setRevealed] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      style={{
        background: 'var(--c-primary)',
        borderRadius: 'var(--r-card)',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
        marginBottom: 16,
      }}
    >
      {/* Background decoration */}
      <div style={{
        position: 'absolute', top: -20, right: -20,
        width: 120, height: 120, borderRadius: '50%',
        background: 'rgba(255,255,255,0.06)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: -30, right: 40,
        width: 80, height: 80, borderRadius: '50%',
        background: 'rgba(255,255,255,0.04)',
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
          color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase',
        }}>
          Word of the Day
        </span>
        <span style={{
          fontSize: 10, fontWeight: 600,
          background: 'rgba(255,255,255,0.15)',
          color: '#fff', padding: '3px 10px',
          borderRadius: 99,
        }}>
          📅 Today
        </span>
      </div>

      <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 4, letterSpacing: '-0.3px' }}>
        {WORD_OF_DAY.word}
      </div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 2 }}>
        {WORD_OF_DAY.pronunciation}
      </div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 14 }}>
        {WORD_OF_DAY.part_of_speech}
      </div>

      {revealed ? (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div style={{ fontSize: 15, color: '#fff', lineHeight: 1.6, marginBottom: 10 }}>
            {WORD_OF_DAY.definition}
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', fontStyle: 'italic', lineHeight: 1.5, marginBottom: 16 }}>
            "{WORD_OF_DAY.example}"
          </div>
          <button
            onClick={onStudy}
            style={{
              background: '#fff', color: 'var(--c-primary)',
              border: 'none', borderRadius: 'var(--r-sm)',
              padding: '10px 20px', fontSize: 14, fontWeight: 700,
              cursor: 'pointer', width: '100%',
            }}
          >
            Study this word →
          </button>
        </motion.div>
      ) : (
        <button
          onClick={() => setRevealed(true)}
          style={{
            background: 'rgba(255,255,255,0.15)',
            border: '1.5px solid rgba(255,255,255,0.25)',
            color: '#fff', borderRadius: 'var(--r-sm)',
            padding: '10px 20px', fontSize: 14, fontWeight: 600,
            cursor: 'pointer', width: '100%',
          }}
        >
          Reveal definition
        </button>
      )}
    </motion.div>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ emoji, value, label, delay = 0, gold = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      style={{
        background: 'var(--c-bg)',
        border: `1px solid ${gold ? 'var(--c-gold-light)' : 'var(--c-border)'}`,
        borderRadius: 'var(--r-card)',
        padding: '14px 12px',
        textAlign: 'center',
        flex: 1,
      }}
    >
      <div style={{ fontSize: 22, marginBottom: 4 }}>{emoji}</div>
      <div style={{
        fontSize: 22, fontWeight: 800,
        color: gold ? 'var(--c-gold)' : 'var(--c-primary)',
        lineHeight: 1,
        marginBottom: 4,
      }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: 'var(--c-text-muted)', fontWeight: 500 }}>{label}</div>
    </motion.div>
  )
}

// ─── Daily goal progress ──────────────────────────────────────────────────────

function DailyGoal({ current, goal }) {
  const pct = Math.min(100, Math.round((current / goal) * 100))
  const done = pct >= 100

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      style={{
        background: 'var(--c-bg)',
        border: '1px solid var(--c-border)',
        borderRadius: 'var(--r-card)',
        padding: 18,
        marginBottom: 16,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-text)' }}>Daily goal</div>
          <div style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>
            {current} / {goal} words
          </div>
        </div>
        <div style={{
          fontSize: 13, fontWeight: 700,
          color: done ? 'var(--c-success)' : 'var(--c-primary)',
          background: done ? 'var(--c-success-pale)' : 'var(--c-primary-pale)',
          padding: '4px 12px', borderRadius: 99,
        }}>
          {done ? '✓ Done!' : `${pct}%`}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 8, background: 'var(--c-border)', borderRadius: 4, overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.4 }}
          style={{
            height: '100%',
            borderRadius: 4,
            background: done ? 'var(--c-success)' : 'var(--c-primary)',
          }}
        />
      </div>

      {/* Segment markers */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
        {Array.from({ length: goal }, (_, i) => (
          <div
            key={i}
            style={{
              width: 6, height: 6, borderRadius: '50%',
              background: i < current ? 'var(--c-primary)' : 'var(--c-border)',
              transition: 'background 0.3s ease',
            }}
          />
        )).slice(0, Math.min(goal, 30))}
      </div>
    </motion.div>
  )
}

// ─── Level progress bar ───────────────────────────────────────────────────────

function LevelBar({ xp }) {
  const level = getLevel(xp)
  const pct = getLevelProgress(xp)
  const xpLeft = getNextLevelXP(xp)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      style={{
        background: 'var(--c-bg)',
        border: '1px solid var(--c-border)',
        borderRadius: 'var(--r-card)',
        padding: '14px 16px',
        marginBottom: 16,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
            color: 'var(--c-primary)',
            background: 'var(--c-primary-pale)',
            padding: '2px 10px', borderRadius: 99,
          }}>
            {level.label}
          </span>
        </div>
        <span style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>
          {xpLeft !== null ? `${xpLeft} XP to next level` : '🏆 Max level!'}
        </span>
      </div>
      <div style={{ height: 6, background: 'var(--c-border)', borderRadius: 3, overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
          style={{ height: '100%', borderRadius: 3, background: 'var(--c-primary)' }}
        />
      </div>
    </motion.div>
  )
}

// ─── Quick actions ────────────────────────────────────────────────────────────

function QuickActions({ wordsCount, navigate }) {
  const actions = [
    {
      emoji: '⚡',
      label: 'Start session',
      sub: 'Learn new words',
      primary: true,
      onClick: () => navigate('/learn'),
    },
    {
      emoji: '📖',
      label: 'Vocab bank',
      sub: `${wordsCount} words`,
      primary: false,
      onClick: () => navigate('/learn?tab=bank'),
    },
    {
      emoji: '🏆',
      label: 'Leaderboard',
      sub: 'See your rank',
      primary: false,
      onClick: () => navigate('/compete'),
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      style={{ marginBottom: 16 }}
    >
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Quick actions
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {actions.map(({ emoji, label, sub, primary, onClick }) => (
          <motion.button
            key={label}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 16px',
              background: primary ? 'var(--c-primary)' : 'var(--c-bg)',
              border: primary ? 'none' : '1px solid var(--c-border)',
              borderRadius: 'var(--r-card)',
              cursor: 'pointer', textAlign: 'left',
              boxShadow: primary ? 'var(--shadow-md)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <span style={{
              fontSize: 22, width: 40, height: 40,
              background: primary ? 'rgba(255,255,255,0.15)' : 'var(--c-primary-pale)',
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              {emoji}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: primary ? '#fff' : 'var(--c-text)', lineHeight: 1.2 }}>
                {label}
              </div>
              <div style={{ fontSize: 12, color: primary ? 'rgba(255,255,255,0.65)' : 'var(--c-text-muted)', marginTop: 2 }}>
                {sub}
              </div>
            </div>
            <span style={{ color: primary ? 'rgba(255,255,255,0.5)' : 'var(--c-text-muted)', fontSize: 16 }}>→</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}

// ─── Word state summary ────────────────────────────────────────────────────────

function WordStates({ words }) {
  const counts = {
    new:        words.filter(w => w.state === 'new').length,
    learning:   words.filter(w => w.state === 'learning').length,
    struggling: words.filter(w => w.state === 'struggling').length,
    mastered:   words.filter(w => w.state === 'mastered').length,
  }
  const total = words.length

  const states = [
    { key: 'mastered',   label: 'Mastered',   color: 'var(--c-state-mastered)',       bg: 'var(--c-state-mastered-bg)' },
    { key: 'learning',   label: 'Learning',   color: 'var(--c-state-learning)',       bg: 'var(--c-state-learning-bg)' },
    { key: 'struggling', label: 'Struggling', color: 'var(--c-state-struggling)',     bg: 'var(--c-state-struggling-bg)' },
    { key: 'new',        label: 'New',        color: 'var(--c-state-new)',            bg: 'var(--c-state-new-bg)' },
  ]

  if (total === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      style={{
        background: 'var(--c-bg)',
        border: '1px solid var(--c-border)',
        borderRadius: 'var(--r-card)',
        padding: 18,
        marginBottom: 16,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-text)' }}>Your vocabulary</div>
        <div style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>{total} words total</div>
      </div>

      {/* Stacked bar */}
      <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 12 }}>
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
        {states.map(({ key, label, color, bg }) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>{label}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-text)', marginLeft: 'auto' }}>{counts[key]}</span>
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

  const xp = profile?.total_xp || 0
  const streak = profile?.current_streak || 0
  const goal = profile?.daily_goal || 10
  const avatar = AVATARS[profile?.avatar_id || 0]

  // Today's session words practiced (placeholder — real impl in Phase 3)
  const todayWords = 0

  return (
    
    <div style={{ paddingTop: 20, paddingBottom: 8 }}>
      <AnimatePresence>
  {showComeback && <ComebackScreen onDismiss={dismissComeback} />}
</AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}
      >
        <div>
          <div style={{ fontSize: 13, color: 'var(--c-text-muted)' }}>Good morning,</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--c-text)', lineHeight: 1.2 }}>
            {profile?.username || 'Learner'} {avatar}
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
              <span style={{ fontSize: 16 }}>🔥</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--c-gold)' }}>{streak}</span>
            </div>
          )}

          {/* Notification bell */}
          <button onClick={() => navigate('/notifications')} style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'var(--c-bg)', border: '1px solid var(--c-border)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18,
          }}>
            🔔
          </button>
        </div>
      </motion.div>

      {/* Level bar */}
      <LevelBar xp={xp} />

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{ display: 'flex', gap: 10, marginBottom: 16 }}
      >
        <StatCard emoji="⚡" value={xp} label="Total XP" delay={0.1} />
        <StatCard emoji="🔥" value={streak} label="Day streak" delay={0.15} gold={streak >= 7} />
        <StatCard emoji="📚" value={words.length} label="Words" delay={0.2} />
      </motion.div>

      {/* Daily goal */}
      <DailyGoal current={todayWords} goal={goal} />

      {/* Word of the day */}
      <WordOfDay onStudy={() => navigate('/word-of-day')} />

      {/* Quick actions */}
      <QuickActions wordsCount={words.length} navigate={navigate} />
 
  {/* Daily Quests */}
      <DailyQuests />

      {/* Word states breakdown */}
      <WordStates words={words} />

      {/* Empty state if no words yet */}
      {words.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{
            textAlign: 'center', padding: '24px 20px',
            background: 'var(--c-bg)',
            border: '1px dashed var(--c-border)',
            borderRadius: 'var(--r-card)',
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--c-text)', marginBottom: 6 }}>
            No words yet
          </div>
          <div style={{ fontSize: 14, color: 'var(--c-text-muted)', marginBottom: 16 }}>
            Add your first SAT words to get started
          </div>
          <button
            onClick={() => navigate('/learn')}
            style={{
              background: 'var(--c-primary)', color: '#fff',
              border: 'none', borderRadius: 'var(--r-sm)',
              padding: '10px 24px', fontSize: 14, fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Add words →
          </button>
        </motion.div>
      )}
    </div>
  )
}