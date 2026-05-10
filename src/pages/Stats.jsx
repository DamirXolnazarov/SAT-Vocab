import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '../stores/authStore'
import { useUserStore } from '../stores/userStore'
import { getLevel, getLevelProgress } from '../stores/userStore'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getSATRange(masteryPct) {
  if (masteryPct >= 90) return { range: '700–800', color: 'var(--c-success)',      bg: 'var(--c-success-pale)' }
  if (masteryPct >= 70) return { range: '600–700', color: 'var(--c-primary)',      bg: 'var(--c-primary-pale)' }
  if (masteryPct >= 40) return { range: '500–600', color: 'var(--c-warning)',      bg: 'var(--c-warning-pale)' }
  return                       { range: '400–500', color: 'var(--c-danger)',       bg: 'var(--c-danger-pale)'  }
}

function getSATReadiness(words) {
  const total    = words.length
  if (total === 0) return 0
  const mastered = words.filter(w => w.state === 'mastered').length
  const avgMastery = words.reduce((s, w) => s + (w.mastery_score || 0), 0) / total
  return Math.round((mastered / total) * 60 + (avgMastery / 100) * 40)
}

// Build last 12 weeks of activity from words last_reviewed_at
function buildHeatmap(words) {
  const counts = {}
  words.forEach(w => {
    if (!w.last_reviewed_at) return
    const d = new Date(w.last_reviewed_at)
    const key = d.toISOString().split('T')[0]
    counts[key] = (counts[key] || 0) + 1
  })

  // Generate 84 days (12 weeks) ending today
  const days = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 83; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    days.push({ date: key, count: counts[key] || 0, day: d.getDay() })
  }
  return days
}

function heatColor(count) {
  if (count === 0)  return 'var(--c-border)'
  if (count < 3)   return '#f9c8d0'
  if (count < 7)   return '#d4697c'
  if (count < 15)  return '#a82236'
  return 'var(--c-primary)'
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--c-text)' }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12, color: 'var(--c-text-muted)', marginTop: 2 }}>{subtitle}</div>}
    </div>
  )
}

// ─── SAT Readiness Ring ───────────────────────────────────────────────────────

function ReadinessRing({ score, satRange }) {
  const r = 52
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.1 }}
      style={{
        background: 'var(--c-bg)',
        border: '1px solid var(--c-border)',
        borderRadius: 'var(--r-card)',
        padding: '24px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        marginBottom: 16,
      }}
    >
      {/* Ring */}
      <div style={{ position: 'relative', flexShrink: 0, width: 130, height: 130 }}>
        <svg width="130" height="130" viewBox="0 0 130 130">
          {/* Track */}
          <circle
            cx="65" cy="65" r={r}
            fill="none"
            stroke="var(--c-border)"
            strokeWidth="10"
          />
          {/* Progress */}
          <motion.circle
            cx="65" cy="65" r={r}
            fill="none"
            stroke={satRange.color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ - dash }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
            transform="rotate(-90 65 65)"
          />
        </svg>
        {/* Center text */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: satRange.color, lineHeight: 1 }}>
            {score}
          </div>
          <div style={{ fontSize: 10, color: 'var(--c-text-muted)', marginTop: 2 }}>/ 100</div>
        </div>
      </div>

      {/* Info */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: 'var(--c-text-muted)', marginBottom: 4 }}>
          SAT Readiness Score
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--c-text)', marginBottom: 8 }}>
          Predicted range
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: satRange.bg,
          border: `1px solid ${satRange.color}`,
          borderRadius: 99, padding: '6px 14px',
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: satRange.color }} />
          <span style={{ fontSize: 18, fontWeight: 800, color: satRange.color }}>
            {satRange.range}
          </span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--c-text-muted)', marginTop: 8, lineHeight: 1.4 }}>
          Based on mastered words and average accuracy
        </div>
      </div>
    </motion.div>
  )
}

// ─── Activity heatmap ─────────────────────────────────────────────────────────

function Heatmap({ days }) {
  const weeks = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  const maxCount = Math.max(...days.map(d => d.count), 1)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      style={{
        background: 'var(--c-bg)',
        border: '1px solid var(--c-border)',
        borderRadius: 'var(--r-card)',
        padding: '18px',
        marginBottom: 16,
        overflowX: 'auto',
      }}
    >
      <SectionHeader title="Study activity" subtitle="Last 12 weeks" />

      <div style={{ display: 'flex', gap: 4, alignItems: 'flex-start' }}>
        {/* Day labels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, paddingTop: 2 }}>
          {DAY_LABELS.map((d, i) => (
            <div key={i} style={{
              width: 12, height: 12,
              fontSize: 9, color: 'var(--c-text-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {i % 2 === 1 ? d : ''}
            </div>
          ))}
        </div>

        {/* Weeks grid */}
        <div style={{ display: 'flex', gap: 3, flex: 1 }}>
          {weeks.map((week, wi) => (
            <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {week.map((day, di) => (
                <motion.div
                  key={day.date}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + wi * 0.02 + di * 0.005 }}
                  title={`${day.date}: ${day.count} words`}
                  style={{
                    width: 12, height: 12,
                    borderRadius: 3,
                    background: heatColor(day.count),
                    cursor: day.count > 0 ? 'pointer' : 'default',
                    transition: 'transform 0.15s ease',
                  }}
                  whileHover={{ scale: 1.4 }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        marginTop: 12, justifyContent: 'flex-end',
      }}>
        <span style={{ fontSize: 10, color: 'var(--c-text-muted)' }}>Less</span>
        {[0, 2, 6, 14, 20].map((v, i) => (
          <div key={i} style={{
            width: 10, height: 10, borderRadius: 2,
            background: heatColor(v),
          }} />
        ))}
        <span style={{ fontSize: 10, color: 'var(--c-text-muted)' }}>More</span>
      </div>
    </motion.div>
  )
}

// ─── Word states breakdown ────────────────────────────────────────────────────

function WordBreakdown({ words }) {
  const total = words.length
  const states = [
    { key: 'mastered',   label: 'Mastered',   color: 'var(--c-state-mastered)',       bg: 'var(--c-state-mastered-bg)'   },
    { key: 'learning',   label: 'Learning',   color: 'var(--c-state-learning)',       bg: 'var(--c-state-learning-bg)'   },
    { key: 'struggling', label: 'Struggling', color: 'var(--c-state-struggling)',     bg: 'var(--c-state-struggling-bg)' },
    { key: 'new',        label: 'New',        color: 'var(--c-state-new)',            bg: 'var(--c-state-new-bg)'        },
  ]
  const counts = Object.fromEntries(states.map(s => [s.key, words.filter(w => w.state === s.key).length]))

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      style={{
        background: 'var(--c-bg)',
        border: '1px solid var(--c-border)',
        borderRadius: 'var(--r-card)',
        padding: '18px',
        marginBottom: 16,
      }}
    >
      <SectionHeader title="Vocabulary breakdown" subtitle={`${total} words total`} />

      {/* Stacked bar */}
      {total > 0 && (
        <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', marginBottom: 16 }}>
          {states.map(({ key, color }) => {
            const pct = total > 0 ? (counts[key] / total) * 100 : 0
            return pct > 0 ? (
              <motion.div
                key={key}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.4 }}
                style={{ height: '100%', background: color }}
              />
            ) : null
          })}
        </div>
      )}

      {/* State rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {states.map(({ key, label, color, bg }) => {
          const count = counts[key]
          const pct   = total > 0 ? Math.round((count / total) * 100) : 0
          return (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--c-text)' }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-text)' }}>
                    {count} <span style={{ color: 'var(--c-text-muted)', fontWeight: 400 }}>({pct}%)</span>
                  </span>
                </div>
                <div style={{ height: 4, background: 'var(--c-border)', borderRadius: 2, overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.7, ease: 'easeOut', delay: 0.5 }}
                    style={{ height: '100%', background: color, borderRadius: 2 }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

// ─── Personal bests ───────────────────────────────────────────────────────────

function PersonalBests({ profile, words }) {
  const avgMastery = words.length > 0
    ? Math.round(words.reduce((s, w) => s + (w.mastery_score || 0), 0) / words.length)
    : 0

  const correctRate = (() => {
    const totalSeen    = words.reduce((s, w) => s + (w.times_seen || 0), 0)
    const totalCorrect = words.reduce((s, w) => s + (w.times_correct || 0), 0)
    return totalSeen > 0 ? Math.round((totalCorrect / totalSeen) * 100) : 0
  })()

  const bests = [
    {
      emoji: '🔥',
      label: 'Longest streak',
      value: `${profile?.longest_streak || 0} days`,
      gold: (profile?.longest_streak || 0) >= 7,
    },
    {
      emoji: '⚡',
      label: 'Total XP earned',
      value: (profile?.total_xp || 0).toLocaleString(),
      gold: (profile?.total_xp || 0) >= 500,
    },
    {
      emoji: '📚',
      label: 'Words mastered',
      value: words.filter(w => w.state === 'mastered').length,
      gold: words.filter(w => w.state === 'mastered').length >= 50,
    },
    {
      emoji: '🎯',
      label: 'Overall accuracy',
      value: `${correctRate}%`,
      gold: correctRate >= 80,
    },
    {
      emoji: '📈',
      label: 'Avg mastery score',
      value: `${avgMastery}/100`,
      gold: avgMastery >= 70,
    },
    {
      emoji: '🏆',
      label: 'Current level',
      value: getLevel(profile?.total_xp || 0).label,
      gold: getLevel(profile?.total_xp || 0).label === 'SAT Master',
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      style={{
        background: 'var(--c-bg)',
        border: '1px solid var(--c-border)',
        borderRadius: 'var(--r-card)',
        padding: '18px',
        marginBottom: 16,
      }}
    >
      <SectionHeader title="Personal bests" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {bests.map(({ emoji, label, value, gold }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 + i * 0.05 }}
            style={{
              background: gold ? 'var(--c-gold-pale)' : 'var(--c-bg-subtle)',
              border: `1px solid ${gold ? 'var(--c-gold-light)' : 'var(--c-border)'}`,
              borderRadius: 'var(--r-sm)',
              padding: '12px',
            }}
          >
            <div style={{ fontSize: 20, marginBottom: 6 }}>{emoji}</div>
            <div style={{
              fontSize: 18, fontWeight: 800,
              color: gold ? 'var(--c-gold)' : 'var(--c-primary)',
              lineHeight: 1, marginBottom: 4,
            }}>
              {value}
            </div>
            <div style={{ fontSize: 11, color: 'var(--c-text-muted)', lineHeight: 1.3 }}>
              {label}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

// ─── Weak words ───────────────────────────────────────────────────────────────

function WeakWords({ words }) {
  const weak = words
    .filter(w => w.times_seen >= 3 && w.times_correct / w.times_seen < 0.5)
    .sort((a, b) => (a.times_correct / a.times_seen) - (b.times_correct / b.times_seen))
    .slice(0, 5)

  if (weak.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      style={{
        background: 'var(--c-bg)',
        border: '1px solid var(--c-border)',
        borderRadius: 'var(--r-card)',
        padding: '18px',
        marginBottom: 16,
      }}
    >
      <SectionHeader
        title="Needs work"
        subtitle="Words with under 50% accuracy — practiced 3× more in sessions"
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {weak.map((w, i) => {
          const acc = Math.round((w.times_correct / w.times_seen) * 100)
          return (
            <motion.div
              key={w.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.06 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px',
                background: 'var(--c-danger-pale)',
                border: '1px solid var(--c-danger)',
                borderRadius: 'var(--r-sm)',
                opacity: 0.9,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--c-text)' }}>
                  {w.word}
                </div>
                <div style={{
                  fontSize: 12, color: 'var(--c-text-muted)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {w.definition}
                </div>
              </div>
              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--c-danger)' }}>
                  {acc}%
                </div>
                <div style={{ fontSize: 10, color: 'var(--c-text-muted)' }}>accuracy</div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

// ─── Level progress ───────────────────────────────────────────────────────────

function LevelProgress({ xp }) {
  const level    = getLevel(xp)
  const progress = getLevelProgress(xp)
  const xpLeft   = level.max === Infinity ? null : level.max + 1 - xp

  const LEVELS_LIST = [
    { label: 'Beginner',     min: 0    },
    { label: 'Learner',      min: 500  },
    { label: 'Intermediate', min: 1500 },
    { label: 'Advanced',     min: 3500 },
    { label: 'SAT Master',   min: 7000 },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      style={{
        background: 'var(--c-bg)',
        border: '1px solid var(--c-border)',
        borderRadius: 'var(--r-card)',
        padding: '18px',
        marginBottom: 16,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <SectionHeader title="Level progress" />
        <span style={{
          fontSize: 11, fontWeight: 700,
          color: 'var(--c-primary)',
          background: 'var(--c-primary-pale)',
          padding: '3px 10px', borderRadius: 99,
        }}>
          {level.label}
        </span>
      </div>

      {/* XP bar */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 13, color: 'var(--c-text-muted)' }}>
            ⚡ {xp.toLocaleString()} XP
          </span>
          <span style={{ fontSize: 13, color: 'var(--c-text-muted)' }}>
            {xpLeft !== null ? `${xpLeft.toLocaleString()} to next` : '🏆 Max level'}
          </span>
        </div>
        <div style={{ height: 8, background: 'var(--c-border)', borderRadius: 4, overflow: 'hidden' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
            style={{ height: '100%', background: 'var(--c-primary)', borderRadius: 4 }}
          />
        </div>
      </div>

      {/* Level milestones */}
      <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
        {/* Track line */}
        <div style={{
          position: 'absolute', top: 10, left: 10, right: 10,
          height: 2, background: 'var(--c-border)', zIndex: 0,
        }} />
        {LEVELS_LIST.map(({ label, min }) => {
          const reached = xp >= min
          return (
            <div key={label} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 6, position: 'relative', zIndex: 1,
            }}>
              <div style={{
                width: 20, height: 20, borderRadius: '50%',
                background: reached ? 'var(--c-primary)' : 'var(--c-border)',
                border: `2px solid ${reached ? 'var(--c-primary)' : 'var(--c-border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.3s ease',
              }}>
                {reached && (
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />
                )}
              </div>
              <div style={{
                fontSize: 9, color: reached ? 'var(--c-primary)' : 'var(--c-text-muted)',
                fontWeight: reached ? 600 : 400, textAlign: 'center', maxWidth: 52,
              }}>
                {label}
              </div>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

// ─── Stats page ───────────────────────────────────────────────────────────────

export function Stats() {
  const { profile }          = useAuthStore()
  const { words }            = useUserStore()
  const xp                   = profile?.total_xp || 0
  const readiness            = useMemo(() => getSATReadiness(words), [words])
  const satRange             = getSATRange(readiness)
  const heatmapDays          = useMemo(() => buildHeatmap(words), [words])
  const masteredPct          = words.length > 0
    ? Math.round((words.filter(w => w.state === 'mastered').length / words.length) * 100)
    : 0

  return (
    <div style={{ paddingTop: 20, paddingBottom: 8 }}>

      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 20 }}
      >
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--c-text)' }}>
          Your stats
        </div>
        <div style={{ fontSize: 13, color: 'var(--c-text-muted)', marginTop: 2 }}>
          {words.length} words · {profile?.current_streak || 0} day streak
        </div>
      </motion.div>

      {/* SAT Readiness */}
      <ReadinessRing score={readiness} satRange={satRange} />

      {/* Level progress */}
      <LevelProgress xp={xp} />

      {/* Activity heatmap */}
      <Heatmap days={heatmapDays} />

      {/* Word breakdown */}
      <WordBreakdown words={words} />

      {/* Personal bests */}
      <PersonalBests profile={profile} words={words} />

      {/* Weak words */}
      <WeakWords words={words} />

      {/* Empty state */}
      {words.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{
            textAlign: 'center', padding: '32px 20px',
            background: 'var(--c-bg)',
            border: '1px dashed var(--c-border)',
            borderRadius: 'var(--r-card)',
            marginTop: 8,
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--c-text)', marginBottom: 6 }}>
            No data yet
          </div>
          <div style={{ fontSize: 14, color: 'var(--c-text-muted)' }}>
            Complete sessions to see your progress here
          </div>
        </motion.div>
      )}
    </div>
  )
}