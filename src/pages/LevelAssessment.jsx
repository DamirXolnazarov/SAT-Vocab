import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'

// ─── Assessment words by difficulty ──────────────────────────────────────────

const ASSESSMENT_QUESTIONS = [
  // Easy
  {
    word: 'Benevolent',
    options: [
      'Feeling or showing goodwill; kindly',
      'Causing harm or destruction',
      'Extremely cautious or careful',
      'Showing a lack of respect',
    ],
    correct: 0,
    difficulty: 'easy',
  },
  {
    word: 'Ambiguous',
    options: [
      'Completely certain and clear',
      'Open to more than one interpretation',
      'Showing great enthusiasm',
      'Relating to the environment',
    ],
    correct: 1,
    difficulty: 'easy',
  },
  // Medium
  {
    word: 'Perfidious',
    options: [
      'Extremely loyal and devoted',
      'Relating to artistic perfection',
      'Deceitful and untrustworthy',
      'Showing great physical strength',
    ],
    correct: 2,
    difficulty: 'medium',
  },
  {
    word: 'Equivocate',
    options: [
      'To speak with equal passion',
      'To use ambiguous language to avoid commitment',
      'To make something equal or balanced',
      'To express strong disagreement',
    ],
    correct: 1,
    difficulty: 'medium',
  },
  // Hard
  {
    word: 'Tendentious',
    options: [
      'Promoting a particular cause or point of view',
      'Showing great physical tenderness',
      'Relating to mathematical tendencies',
      'Easily stretched or bent',
    ],
    correct: 0,
    difficulty: 'hard',
  },
]

// ─── Level result ─────────────────────────────────────────────────────────────

function getLevel(score) {
  if (score <= 1) return {
    level:    'Beginner',
    emoji:    '🌱',
    desc:     'You\'re just starting out — perfect. We\'ll build your foundation word by word.',
    xpStart:  0,
    color:    'var(--c-state-new)',
    bg:       'var(--c-state-new-bg)',
    wordPool: 'easy',
  }
  if (score <= 3) return {
    level:    'Intermediate',
    emoji:    '📚',
    desc:     'You know your basics. We\'ll skip the easy stuff and focus on expanding your range.',
    xpStart:  500,
    color:    'var(--c-warning)',
    bg:       'var(--c-warning-pale)',
    wordPool: 'medium',
  }
  return {
    level:    'Advanced',
    emoji:    '🔥',
    desc:     'Strong vocabulary already. We\'ll challenge you with the hardest SAT words from day one.',
    xpStart:  1500,
    color:    'var(--c-primary)',
    bg:       'var(--c-primary-pale)',
    wordPool: 'hard',
  }
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ current, total }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 13, color: 'var(--c-text-muted)' }}>
          Question {current} of {total}
        </span>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-primary)' }}>
          {Math.round((current / total) * 100)}%
        </span>
      </div>
      <div style={{ height: 6, background: 'var(--c-border)', borderRadius: 3, overflow: 'hidden' }}>
        <motion.div
          animate={{ width: `${(current / total) * 100}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{ height: '100%', background: 'var(--c-primary)', borderRadius: 3 }}
        />
      </div>
    </div>
  )
}

// ─── Single question ──────────────────────────────────────────────────────────

function Question({ q, index, onAnswer }) {
  const [selected, setSelected] = useState(null)

  const handleSelect = (i) => {
    if (selected !== null) return
    setSelected(i)
    setTimeout(() => onAnswer(i === q.correct), 800)
  }

  const getStyle = (i) => {
    const base = {
      width: '100%', minHeight: 56, padding: '14px 18px',
      textAlign: 'left', fontSize: 15, lineHeight: 1.5,
      fontWeight: 500, borderRadius: 'var(--r-sm)',
      border: '1.5px solid', cursor: selected !== null ? 'default' : 'pointer',
      transition: 'all 0.15s ease',
    }
    if (selected === null) return {
      ...base,
      background: 'var(--c-bg)',
      borderColor: 'var(--c-border)',
      color: 'var(--c-text)',
    }
    if (i === q.correct) return {
      ...base,
      background: 'var(--c-success-pale)',
      borderColor: 'var(--c-success)',
      color: 'var(--c-success)',
    }
    if (i === selected) return {
      ...base,
      background: 'var(--c-danger-pale)',
      borderColor: 'var(--c-danger)',
      color: 'var(--c-danger)',
    }
    return {
      ...base,
      background: 'var(--c-bg)',
      borderColor: 'var(--c-border)',
      color: 'var(--c-text-muted)',
      opacity: 0.5,
    }
  }

  const diffColors = {
    easy:   { bg: 'var(--c-success-pale)',  color: 'var(--c-success)'  },
    medium: { bg: 'var(--c-warning-pale)',  color: 'var(--c-warning)'  },
    hard:   { bg: 'var(--c-danger-pale)',   color: 'var(--c-danger)'   },
  }
  const dc = diffColors[q.difficulty]

  return (
    <motion.div
      key={index}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.25 }}
    >
      {/* Difficulty badge */}
      <div style={{ marginBottom: 20 }}>
        <span style={{
          fontSize: 11, fontWeight: 600, padding: '3px 10px',
          borderRadius: 99, textTransform: 'capitalize',
          background: dc.bg, color: dc.color,
        }}>
          {q.difficulty}
        </span>
      </div>

      {/* Word prompt */}
      <div style={{
        background: 'var(--c-bg)',
        border: '1px solid var(--c-border)',
        borderRadius: 'var(--r-card)',
        padding: '28px 24px',
        textAlign: 'center',
        marginBottom: 24,
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{
          fontSize: 11, fontWeight: 600, letterSpacing: '0.1em',
          color: 'var(--c-text-muted)', textTransform: 'uppercase',
          marginBottom: 12,
        }}>
          What does this word mean?
        </div>
        <div style={{
          fontSize: 36, fontWeight: 900,
          color: 'var(--c-text)',
          fontFamily: 'Georgia, "Times New Roman", serif',
          letterSpacing: '-0.5px',
        }}>
          {q.word}
        </div>
      </div>

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {q.options.map((opt, i) => (
          <motion.button
            key={i}
            whileTap={selected === null ? { scale: 0.99 } : {}}
            onClick={() => handleSelect(i)}
            style={getStyle(i)}
          >
            <span style={{
              display: 'inline-block', width: 24, height: 24,
              borderRadius: '50%', fontSize: 12, fontWeight: 700,
              background: selected === null ? 'var(--c-bg-subtle)' : 'transparent',
              color: 'var(--c-text-muted)',
              marginRight: 12, textAlign: 'center', lineHeight: '24px',
              flexShrink: 0,
            }}>
              {['A','B','C','D'][i]}
            </span>
            {opt}
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}

// ─── Result screen ────────────────────────────────────────────────────────────

function Result({ score, result, onContinue }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{ textAlign: 'center' }}
    >
      {/* Emoji */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', damping: 14, delay: 0.1 }}
        style={{ fontSize: 64, marginBottom: 16 }}
      >
        {result.emoji}
      </motion.div>

      <div style={{
        fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
        color: 'var(--c-text-muted)', textTransform: 'uppercase',
        marginBottom: 8,
      }}>
        Your level
      </div>

      <div style={{
        fontSize: 36, fontWeight: 900,
        color: 'var(--c-text)',
        fontFamily: 'Georgia, serif',
        letterSpacing: '-0.5px',
        marginBottom: 8,
      }}>
        {result.level}
      </div>

      {/* Score */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        background: result.bg, color: result.color,
        borderRadius: 99, padding: '6px 16px',
        fontSize: 14, fontWeight: 600, marginBottom: 20,
      }}>
        {score} / {ASSESSMENT_QUESTIONS.length} correct
      </div>

      <p style={{
        fontSize: 15, color: 'var(--c-text-muted)',
        lineHeight: 1.7, marginBottom: 32,
        maxWidth: 340, margin: '0 auto 32px',
      }}>
        {result.desc}
      </p>

      {/* What happens next */}
      <div style={{
        background: 'var(--c-bg-subtle)',
        border: '1px solid var(--c-border)',
        borderRadius: 'var(--r-card)',
        padding: '18px', marginBottom: 28,
        textAlign: 'left',
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-text)', marginBottom: 12 }}>
          What happens next
        </div>
        {[
          `Starting at ${result.level} level`,
          `Words matched to your ability`,
          'Progress tracked word by word',
        ].map((item, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            fontSize: 13, color: 'var(--c-text-muted)',
            marginBottom: i < 2 ? 8 : 0,
          }}>
            <span style={{ color: 'var(--c-success)', fontWeight: 700 }}>✓</span>
            {item}
          </div>
        ))}
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onContinue}
        style={{
          width: '100%', minHeight: 54,
          background: 'var(--c-primary)', color: '#fff',
          border: 'none', borderRadius: 'var(--r-sm)',
          fontSize: 17, fontWeight: 700, cursor: 'pointer',
        }}
      >
        Start learning →
      </motion.button>
    </motion.div>
  )
}

// ─── LevelAssessment ─────────────────────────────────────────────────────────

export function LevelAssessment({ onComplete }) {
  const { profile, updateProfile } = useAuthStore()
  const [phase,   setPhase]   = useState('intro') // intro | test | result
  const [qIndex,  setQIndex]  = useState(0)
  const [score,   setScore]   = useState(0)
  const [saving,  setSaving]  = useState(false)

  const handleAnswer = (correct) => {
    const newScore = score + (correct ? 1 : 0)
    setScore(newScore)

    if (qIndex + 1 >= ASSESSMENT_QUESTIONS.length) {
      finishTest(newScore)
    } else {
      setQIndex(i => i + 1)
    }
  }

  const finishTest = async (finalScore) => {
    const result = getLevel(finalScore)
    setSaving(true)
    try {
      await updateProfile({
        level:    result.level,
        total_xp: result.xpStart,
      })
    } catch (err) {
      console.warn('Could not save level:', err.message)
    } finally {
      setSaving(false)
      setPhase('result')
    }
  }

  const handleSkip = async (chosenLevel) => {
    const levelMap = {
      'Beginner':     { xpStart: 0    },
      'Intermediate': { xpStart: 500  },
      'Advanced':     { xpStart: 1500 },
    }
    setSaving(true)
    try {
      await updateProfile({
        level:    chosenLevel,
        total_xp: levelMap[chosenLevel]?.xpStart || 0,
      })
    } catch (err) {
      console.warn('Could not save level:', err.message)
    } finally {
      setSaving(false)
      onComplete(chosenLevel)
    }
  }

  const result = getLevel(score)

  return (
    <div style={{
      minHeight: '100svh',
      background: 'var(--c-bg-off)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: 480 }}>

        {/* ── INTRO ── */}
        <AnimatePresence mode="wait">
          {phase === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              style={{ textAlign: 'center' }}
            >
              {/* Logo */}
              <div style={{ marginBottom: 32 }}>
                <div style={{
                  width: 56, height: 56,
                  background: 'var(--c-primary)',
                  borderRadius: 16, margin: '0 auto 12px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: 'var(--shadow-md)',
                }}>
                  <span style={{ color: '#fff', fontSize: 26, fontWeight: 900, fontFamily: 'Georgia, serif' }}>V</span>
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--c-text)', fontFamily: 'Georgia, serif' }}>
                  Vocabook
                </div>
              </div>

              <div style={{ fontSize: 52, marginBottom: 16 }}>🎯</div>

              <h2 style={{
                fontSize: 26, fontWeight: 800,
                color: 'var(--c-text)', marginBottom: 10,
                fontFamily: 'Georgia, serif',
              }}>
                Let's find your level
              </h2>
              <p style={{
                fontSize: 15, color: 'var(--c-text-muted)',
                lineHeight: 1.7, marginBottom: 36,
              }}>
                5 quick questions to place you at the right starting point.
                No pressure — just honest answers.
              </p>

              {/* Test button */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setPhase('test')}
                style={{
                  width: '100%', minHeight: 54,
                  background: 'var(--c-primary)', color: '#fff',
                  border: 'none', borderRadius: 'var(--r-sm)',
                  fontSize: 16, fontWeight: 700,
                  cursor: 'pointer', marginBottom: 14,
                }}
              >
                Take the placement test
              </motion.button>

              {/* Manual pick */}
              <div style={{
                background: 'var(--c-bg)',
                border: '1px solid var(--c-border)',
                borderRadius: 'var(--r-card)',
                padding: '16px', marginBottom: 8,
              }}>
                <div style={{
                  fontSize: 13, fontWeight: 600, color: 'var(--c-text-muted)',
                  marginBottom: 12, textAlign: 'left',
                }}>
                  Or pick your level manually
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { label: 'Beginner',     emoji: '🌱', desc: 'New to SAT vocabulary' },
                    { label: 'Intermediate', emoji: '📚', desc: 'Know the basics, want more' },
                    { label: 'Advanced',     emoji: '🔥', desc: 'Strong vocab, want a challenge' },
                  ].map(({ label, emoji, desc }) => (
                    <motion.button
                      key={label}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSkip(label)}
                      disabled={saving}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px 14px', textAlign: 'left',
                        background: 'var(--c-bg-subtle)',
                        border: '1px solid var(--c-border)',
                        borderRadius: 'var(--r-sm)',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        opacity: saving ? 0.6 : 1,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span style={{ fontSize: 22 }}>{emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-text)' }}>
                          {label}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>
                          {desc}
                        </div>
                      </div>
                      <span style={{ color: 'var(--c-text-muted)', fontSize: 16 }}>›</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── TEST ── */}
          {phase === 'test' && (
            <motion.div
              key="test"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ProgressBar current={qIndex + 1} total={ASSESSMENT_QUESTIONS.length} />
              <AnimatePresence mode="wait">
                <Question
                  key={qIndex}
                  q={ASSESSMENT_QUESTIONS[qIndex]}
                  index={qIndex}
                  onAnswer={handleAnswer}
                />
              </AnimatePresence>
            </motion.div>
          )}

          {/* ── RESULT ── */}
          {phase === 'result' && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <Result
                score={score}
                result={result}
                onContinue={() => onComplete(result.level)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}