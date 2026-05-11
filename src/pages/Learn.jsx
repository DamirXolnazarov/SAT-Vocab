import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart, Zap, ChevronRight, RotateCcw,
  BookOpen, Layers, PenLine, Type, CheckCircle, XCircle
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { useUserStore } from '../stores/userStore'
import { VocabBank } from './VocabBank'
import { StoryMode } from './StoryMode'

// ─── XP constants ─────────────────────────────────────────────────────────────

const XP_CORRECT       = 10
const XP_DAILY_GOAL    = 50
const XP_FIRST_LEARN   = 5

// ─── Leaderboard XP writer ────────────────────────────────────────────────────

async function writeToLeaderboard(userId, xpAmount) {
  try {
    const now       = new Date()
    const day       = now.getUTCDay() || 7
    const weekStart = new Date(now)
    weekStart.setUTCDate(now.getUTCDate() - day + 1)
    weekStart.setUTCHours(0, 0, 0, 0)
    const weekKey = weekStart.toISOString().split('T')[0]

    // Upsert — add XP to existing row or create new one
    const { data: existing } = await supabase
      .from('leaderboard_weekly')
      .select('id, xp_earned')
      .eq('user_id', userId)
      .eq('week_start_date', weekKey)
      .single()

    if (existing) {
      await supabase
        .from('leaderboard_weekly')
        .update({ xp_earned: (existing.xp_earned || 0) + xpAmount })
        .eq('id', existing.id)
    } else {
      await supabase
        .from('leaderboard_weekly')
        .insert({ user_id: userId, week_start_date: weekKey, xp_earned: xpAmount })
    }
  } catch (err) {
    console.warn('Leaderboard write failed:', err.message)
  }
}

// ─── Hearts display ───────────────────────────────────────────────────────────

function Hearts({ count }) {
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <motion.div
          key={i}
          animate={i === count ? { scale: [1, 1.3, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          <Heart
            size={18}
            fill={i < count ? 'var(--c-danger)' : 'none'}
            color={i < count ? 'var(--c-danger)' : 'var(--c-border)'}
            strokeWidth={1.5}
          />
        </motion.div>
      ))}
    </div>
  )
}

// ─── XP float ────────────────────────────────────────────────────────────────

function XPFloat({ amount, onDone }) {
  return (
    <motion.div
      initial={{ opacity: 1, y: 0 }}
      animate={{ opacity: 0, y: -44 }}
      transition={{ duration: 0.85, ease: 'easeOut' }}
      onAnimationComplete={onDone}
      style={{
        position: 'fixed', top: 72, right: 20, zIndex: 200,
        display: 'flex', alignItems: 'center', gap: 4,
        fontSize: 15, fontWeight: 800, color: 'var(--c-gold)',
        pointerEvents: 'none',
        filter: 'drop-shadow(0 2px 4px rgba(201,150,58,0.4))',
      }}
    >
      <Zap size={14} fill="var(--c-gold)" />
      +{amount} XP
    </motion.div>
  )
}

// ─── Answer feedback overlay ──────────────────────────────────────────────────

function AnswerFeedback({ correct }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 150,
        background: correct
          ? 'rgba(29,158,117,0.12)'
          : 'rgba(216,90,48,0.12)',
        pointerEvents: 'none',
      }}
    />
  )
}

// ─── Exercise 1: Flashcard ────────────────────────────────────────────────────

function Flashcard({ word, onRate }) {
  const [flipped, setFlipped] = useState(false)

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Card */}
      <motion.div
        onClick={() => setFlipped(f => !f)}
        style={{
          flex: 1, minHeight: 260,
          background: 'var(--c-bg)',
          border: '1px solid var(--c-border)',
          borderRadius: 20, padding: '28px 24px',
          cursor: 'pointer',
          boxShadow: 'var(--shadow-md)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', position: 'relative',
          overflow: 'hidden',
        }}
        whileTap={{ scale: 0.99 }}
      >
        <div style={{
          position: 'absolute', top: -20, right: -20,
          width: 100, height: 100, borderRadius: '50%',
          background: 'var(--c-primary-pale)', pointerEvents: 'none',
        }} />

        <div style={{
          position: 'absolute', top: 14, right: 14,
          fontSize: 10, color: 'var(--c-text-muted)',
          letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>
          {flipped ? 'Definition' : 'Tap to flip'}
        </div>

        <AnimatePresence mode="wait">
          {!flipped ? (
            <motion.div
              key="front"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              style={{ textAlign: 'center' }}
            >
              <div style={{
                fontSize: 34, fontWeight: 900,
                color: 'var(--c-text)',
                fontFamily: 'Georgia, serif',
                letterSpacing: '-0.5px', marginBottom: 8,
              }}>
                {word.word}
              </div>
              {word.pronunciation && (
                <div style={{ fontSize: 14, color: 'var(--c-text-muted)', marginBottom: 4 }}>
                  {word.pronunciation}
                </div>
              )}
              {word.part_of_speech && (
                <div style={{ fontSize: 12, color: 'var(--c-primary)', fontWeight: 500 }}>
                  {word.part_of_speech}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="back"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
            >
              <p style={{ fontSize: 16, color: 'var(--c-text)', lineHeight: 1.65, marginBottom: 14 }}>
                {word.definition}
              </p>
              {word.example_sentence_1 && (
                <p style={{
                  fontSize: 13, color: 'var(--c-text-muted)',
                  fontStyle: 'italic', lineHeight: 1.5,
                  padding: '10px 14px',
                  background: 'var(--c-bg-subtle)',
                  borderRadius: 10,
                }}>
                  "{word.example_sentence_1}"
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Rate buttons */}
      <AnimatePresence>
        {flipped && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', gap: 10 }}
          >
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => onRate(false)}
              style={{
                flex: 1, minHeight: 52,
                background: 'var(--c-danger-pale)',
                border: '1.5px solid var(--c-danger)',
                borderRadius: 'var(--r-sm)',
                color: 'var(--c-danger)',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              <XCircle size={16} />
              Hard
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => onRate(true)}
              style={{
                flex: 1, minHeight: 52,
                background: 'var(--c-success-pale)',
                border: '1.5px solid var(--c-success)',
                borderRadius: 'var(--r-sm)',
                color: 'var(--c-success)',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              <CheckCircle size={16} />
              Easy
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Exercise 2: Multiple choice ──────────────────────────────────────────────

function MultipleChoice({ word, allWords, onAnswer }) {
  const [selected, setSelected] = useState(null)

  const options = (() => {
    const wrong = allWords
      .filter(w => w.id !== word.id && w.definition)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(w => ({ text: w.definition, correct: false }))
    return [{ text: word.definition, correct: true }, ...wrong]
      .sort(() => Math.random() - 0.5)
  })()

  const handleSelect = (i) => {
    if (selected !== null) return
    setSelected(i)
    setTimeout(() => onAnswer(options[i].correct), 750)
  }

  const getStyle = (i) => {
    const base = {
      width: '100%', minHeight: 54, padding: '13px 16px',
      textAlign: 'left', fontSize: 14, lineHeight: 1.5,
      fontWeight: 500, borderRadius: 'var(--r-sm)',
      border: '1.5px solid', cursor: selected !== null ? 'default' : 'pointer',
      transition: 'all 0.15s ease',
      display: 'flex', alignItems: 'center', gap: 12,
    }
    if (selected === null) return {
      ...base, background: 'var(--c-bg)',
      borderColor: 'var(--c-border)', color: 'var(--c-text)',
    }
    if (options[i].correct) return {
      ...base, background: 'var(--c-success-pale)',
      borderColor: 'var(--c-success)', color: 'var(--c-success)',
    }
    if (i === selected) return {
      ...base, background: 'var(--c-danger-pale)',
      borderColor: 'var(--c-danger)', color: 'var(--c-danger)',
    }
    return {
      ...base, background: 'var(--c-bg)',
      borderColor: 'var(--c-border)', color: 'var(--c-text-muted)', opacity: 0.45,
    }
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{
        background: 'var(--c-bg)',
        border: '1px solid var(--c-border)',
        borderRadius: 'var(--r-card)', padding: '24px',
        textAlign: 'center', boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{
          fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
          color: 'var(--c-text-muted)', textTransform: 'uppercase', marginBottom: 10,
        }}>
          What does this word mean?
        </div>
        <div style={{
          fontSize: 32, fontWeight: 900, color: 'var(--c-text)',
          fontFamily: 'Georgia, serif', letterSpacing: '-0.5px',
        }}>
          {word.word}
        </div>
        {word.pronunciation && (
          <div style={{ fontSize: 13, color: 'var(--c-text-muted)', marginTop: 6 }}>
            {word.pronunciation}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {options.map((opt, i) => (
          <motion.button
            key={i}
            whileTap={selected === null ? { scale: 0.99 } : {}}
            onClick={() => handleSelect(i)}
            style={getStyle(i)}
          >
            <span style={{
              width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
              background: 'var(--c-bg-subtle)', fontSize: 12, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--c-text-muted)',
            }}>
              {['A','B','C','D'][i]}
            </span>
            {opt.text}
          </motion.button>
        ))}
      </div>
    </div>
  )
}

// ─── Exercise 3: Fill in the blank ────────────────────────────────────────────

function levenshtein(a, b) {
  const m = a.length, n = b.length
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0)
  )
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])
    }
  }
  return dp[m][n]
}

function FillInBlank({ word, onAnswer }) {
  const [input,  setInput]  = useState('')
  const [result, setResult] = useState(null) // null | 'correct' | 'typo' | 'wrong'
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const sentence = word.fill_in_blank_sentence || word.example_sentence_1
    ? (word.fill_in_blank_sentence || word.example_sentence_1.replace(
        new RegExp(word.word, 'gi'), '[BLANK]'
      ))
    : `The word [BLANK] means: ${word.definition}`

  const handleSubmit = () => {
    if (result || !input.trim()) return
    const userAns = input.trim().toLowerCase()
    const correct = word.word.toLowerCase()
    const dist    = levenshtein(userAns, correct)

    if (dist === 0) {
      setResult('correct')
      setTimeout(() => onAnswer(true), 800)
    } else if (dist === 1) {
      setResult('typo')
      setTimeout(() => onAnswer(true), 1200) // close enough
    } else {
      setResult('wrong')
      setTimeout(() => onAnswer(false), 900)
    }
  }

  const parts   = sentence.split('[BLANK]')
  const color   = result === 'correct' || result === 'typo'
    ? 'var(--c-success)' : result === 'wrong'
    ? 'var(--c-danger)' : 'var(--c-primary)'

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Instruction */}
      <div style={{
        background: 'var(--c-bg)', border: '1px solid var(--c-border)',
        borderRadius: 'var(--r-card)', padding: '20px', textAlign: 'center',
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--c-text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>
          Fill in the blank
        </div>
        <div style={{ fontSize: 15, color: 'var(--c-text)', lineHeight: 1.8 }}>
          {parts[0]}
          <span style={{
            display: 'inline-block',
            borderBottom: `2.5px solid ${color}`,
            minWidth: 80, padding: '0 4px',
            color: color, fontWeight: 700,
            transition: 'color 0.2s, border-color 0.2s',
          }}>
            {result ? input : '___'}
          </span>
          {parts[1]}
        </div>
      </div>

      {/* Input */}
      <input
        ref={inputRef}
        value={input}
        onChange={e => { if (!result) setInput(e.target.value) }}
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        placeholder={`Type the missing word…`}
        disabled={!!result}
        style={{
          width: '100%', padding: '14px 16px', minHeight: 52,
          background: result === 'correct' || result === 'typo'
            ? 'var(--c-success-pale)'
            : result === 'wrong'
            ? 'var(--c-danger-pale)'
            : 'var(--c-bg)',
          border: `1.5px solid ${result === 'correct' || result === 'typo'
            ? 'var(--c-success)'
            : result === 'wrong'
            ? 'var(--c-danger)'
            : 'var(--c-border)'}`,
          borderRadius: 'var(--r-sm)',
          fontSize: 17, fontWeight: 600, color: 'var(--c-text)',
          outline: 'none', boxSizing: 'border-box',
          transition: 'all 0.2s ease',
          textAlign: 'center',
        }}
      />

      {/* Typo warning */}
      <AnimatePresence>
        {result === 'typo' && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: '8px 14px',
              background: 'var(--c-warning-pale)',
              border: '1px solid var(--c-warning)',
              borderRadius: 'var(--r-sm)',
              fontSize: 13, color: 'var(--c-warning)', fontWeight: 500,
              textAlign: 'center',
            }}
          >
            Close enough! The correct spelling is "{word.word}"
          </motion.div>
        )}
        {result === 'wrong' && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: '8px 14px',
              background: 'var(--c-danger-pale)',
              border: '1px solid var(--c-danger)',
              borderRadius: 'var(--r-sm)',
              fontSize: 13, color: 'var(--c-danger)', fontWeight: 500,
              textAlign: 'center',
            }}
          >
            The answer was "{word.word}"
          </motion.div>
        )}
      </AnimatePresence>

      {!result && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSubmit}
          style={{
            width: '100%', minHeight: 48,
            background: input.trim() ? 'var(--c-primary)' : 'var(--c-border)',
            color: input.trim() ? '#fff' : 'var(--c-text-muted)',
            border: 'none', borderRadius: 'var(--r-sm)',
            fontSize: 15, fontWeight: 600,
            cursor: input.trim() ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            transition: 'all 0.2s ease',
          }}
        >
          <CheckCircle size={16} />
          Check answer
        </motion.button>
      )}
    </div>
  )
}

// ─── Exercise 4: Type the word ────────────────────────────────────────────────

function TypeTheWord({ word, onAnswer }) {
  const [input,  setInput]  = useState('')
  const [result, setResult] = useState(null)
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const handleSubmit = () => {
    if (result || !input.trim()) return
    const dist = levenshtein(input.trim().toLowerCase(), word.word.toLowerCase())
    if (dist === 0) {
      setResult('correct')
      setTimeout(() => onAnswer(true), 800)
    } else if (dist === 1) {
      setResult('typo')
      setTimeout(() => onAnswer(true), 1200)
    } else {
      setResult('wrong')
      setTimeout(() => onAnswer(false), 900)
    }
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Definition shown */}
      <div style={{
        background: 'var(--c-bg)', border: '1px solid var(--c-border)',
        borderRadius: 'var(--r-card)', padding: '24px', textAlign: 'center',
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--c-text-muted)', textTransform: 'uppercase', marginBottom: 14 }}>
          Type the word that means:
        </div>
        <p style={{ fontSize: 17, color: 'var(--c-text)', lineHeight: 1.65, marginBottom: 14 }}>
          {word.definition}
        </p>
        {word.part_of_speech && (
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99,
            background: 'var(--c-primary-pale)', color: 'var(--c-primary)',
          }}>
            {word.part_of_speech}
          </span>
        )}
        {/* Hint: first letter */}
        <div style={{ marginTop: 16, fontSize: 13, color: 'var(--c-text-muted)' }}>
          Hint: starts with <strong style={{ color: 'var(--c-primary)' }}>"{word.word[0]}"</strong>
          {' '}· {word.word.length} letters
        </div>
      </div>

      {/* Input */}
      <input
        ref={inputRef}
        value={input}
        onChange={e => { if (!result) setInput(e.target.value) }}
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        placeholder="Type the word…"
        disabled={!!result}
        style={{
          width: '100%', padding: '14px 16px', minHeight: 52,
          background: result === 'correct' || result === 'typo'
            ? 'var(--c-success-pale)'
            : result === 'wrong'
            ? 'var(--c-danger-pale)'
            : 'var(--c-bg)',
          border: `1.5px solid ${
            result === 'correct' || result === 'typo' ? 'var(--c-success)'
            : result === 'wrong' ? 'var(--c-danger)'
            : 'var(--c-border)'
          }`,
          borderRadius: 'var(--r-sm)',
          fontSize: 17, fontWeight: 600, color: 'var(--c-text)',
          outline: 'none', boxSizing: 'border-box',
          textAlign: 'center',
          transition: 'all 0.2s ease',
        }}
      />

      <AnimatePresence>
        {result === 'typo' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ padding: '8px 14px', background: 'var(--c-warning-pale)', border: '1px solid var(--c-warning)', borderRadius: 'var(--r-sm)', fontSize: 13, color: 'var(--c-warning)', fontWeight: 500, textAlign: 'center' }}>
            Almost! Correct spelling: "{word.word}"
          </motion.div>
        )}
        {result === 'wrong' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ padding: '8px 14px', background: 'var(--c-danger-pale)', border: '1px solid var(--c-danger)', borderRadius: 'var(--r-sm)', fontSize: 13, color: 'var(--c-danger)', fontWeight: 500, textAlign: 'center' }}>
            The word was "{word.word}"
          </motion.div>
        )}
      </AnimatePresence>

      {!result && (
        <motion.button whileTap={{ scale: 0.97 }} onClick={handleSubmit}
          style={{
            width: '100%', minHeight: 48,
            background: input.trim() ? 'var(--c-primary)' : 'var(--c-border)',
            color: input.trim() ? '#fff' : 'var(--c-text-muted)',
            border: 'none', borderRadius: 'var(--r-sm)',
            fontSize: 15, fontWeight: 600, cursor: input.trim() ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            transition: 'all 0.2s ease',
          }}>
          <CheckCircle size={16} />
          Check answer
        </motion.button>
      )}
    </div>
  )
}

// ─── Session summary ──────────────────────────────────────────────────────────

function SessionSummary({ xp, correct, total, streak, onDone }) {
  const pct = Math.round((correct / total) * 100)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '20px 0' }}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.1, damping: 14 }}
        style={{
          width: 80, height: 80, borderRadius: 24,
          background: 'var(--c-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 20, boxShadow: '0 8px 24px rgba(139,26,46,0.3)',
        }}
      >
        <CheckCircle size={36} color="#fff" />
      </motion.div>

      <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--c-text)', marginBottom: 6 }}>
        Session complete!
      </h2>
      <p style={{ fontSize: 15, color: 'var(--c-text-muted)', marginBottom: 32 }}>
        {pct >= 80 ? 'Excellent work!' : pct >= 60 ? 'Good progress!' : 'Keep practicing!'}
      </p>

      <div style={{ display: 'flex', gap: 12, width: '100%', marginBottom: 32 }}>
        {[
          { icon: <Zap size={20} color="var(--c-gold)" />, value: `+${xp}`, label: 'XP earned', color: 'var(--c-gold)' },
          { icon: <CheckCircle size={20} color="var(--c-success)" />, value: `${correct}/${total}`, label: 'Correct', color: 'var(--c-success)' },
          { icon: <RotateCcw size={20} color="var(--c-primary)" />, value: `${pct}%`, label: 'Accuracy', color: 'var(--c-primary)' },
        ].map(({ icon, value, label, color }) => (
          <div key={label} style={{
            flex: 1, padding: '16px 8px', textAlign: 'center',
            background: 'var(--c-bg)',
            border: '1px solid var(--c-border)',
            borderRadius: 'var(--r-card)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>{icon}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color, marginBottom: 4 }}>{value}</div>
            <div style={{ fontSize: 11, color: 'var(--c-text-muted)' }}>{label}</div>
          </div>
        ))}
      </div>

      {streak > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', marginBottom: 24,
            background: 'var(--c-gold-pale)',
            border: '1px solid var(--c-gold-light)',
            borderRadius: 99,
          }}
        >
          <Flame size={16} color="var(--c-gold)" fill="var(--c-gold)" />
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-gold)' }}>
            {streak} day streak!
          </span>
        </motion.div>
      )}

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onDone}
        style={{
          width: '100%', minHeight: 52,
          background: 'var(--c-primary)', color: '#fff',
          border: 'none', borderRadius: 'var(--r-sm)',
          fontSize: 16, fontWeight: 700, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        Continue
        <ChevronRight size={18} />
      </motion.button>
    </motion.div>
  )
}

// ─── Session lobby ────────────────────────────────────────────────────────────

function SessionLobby({ onStart }) {
  const { profile } = useAuthStore()
  const { words }   = useUserStore()

  const dueCount = words.filter(w => w.state !== 'mastered' && w.state !== 'new').length
  const newCount = words.filter(w => w.state === 'new').length
  const total    = Math.min(dueCount + Math.min(newCount, 3), profile?.daily_goal || 10)

  const exercises = [
    { icon: <Layers size={16} color="var(--c-primary)" />, label: 'Flashcards', desc: 'Flip and self-rate' },
    { icon: <BookOpen size={16} color="var(--c-primary)" />, label: 'Multiple choice', desc: 'Pick the right definition' },
    { icon: <PenLine size={16} color="var(--c-primary)" />, label: 'Fill in the blank', desc: 'Complete the sentence' },
    { icon: <Type size={16} color="var(--c-primary)" />, label: 'Type the word', desc: 'Definition given, type the word' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}
    >
      {/* Header card */}
      <div style={{
        background: 'linear-gradient(135deg, var(--c-primary-dark) 0%, var(--c-primary) 100%)',
        borderRadius: 'var(--r-card)', padding: '24px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>
          Today's session
        </div>
        <div style={{ fontSize: 30, fontWeight: 900, color: '#fff', marginBottom: 4, fontFamily: 'Georgia, serif' }}>
          {total} words
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
          {Math.min(newCount, 3)} new · {dueCount} review
        </div>
      </div>

      {/* Exercise types */}
      <div style={{ background: 'var(--c-bg)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-card)', padding: '16px' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
          Exercise types
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {exercises.map(({ icon, label, desc }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--c-primary-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {icon}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-text)' }}>{label}</div>
                <div style={{ fontSize: 11, color: 'var(--c-text-muted)' }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* XP info */}
      <div style={{ display: 'flex', gap: 8 }}>
        {[
          { icon: <Zap size={14} color="var(--c-gold)" />, text: '+10 XP per correct answer' },
          { icon: <Heart size={14} color="var(--c-danger)" />, text: '5 hearts per session' },
        ].map(({ icon, text }) => (
          <div key={text} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, padding: '10px 12px', background: 'var(--c-bg)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-sm)' }}>
            {icon}
            <span style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>{text}</span>
          </div>
        ))}
      </div>

      <div style={{ flex: 1 }} />

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onStart}
        disabled={words.length === 0}
        style={{
          width: '100%', minHeight: 54,
          background: words.length === 0 ? 'var(--c-border)' : 'var(--c-primary)',
          color: words.length === 0 ? 'var(--c-text-muted)' : '#fff',
          border: 'none', borderRadius: 'var(--r-sm)',
          fontSize: 16, fontWeight: 700,
          cursor: words.length === 0 ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        <Zap size={18} />
        {words.length === 0 ? 'Add words first' : 'Start session'}
      </motion.button>
    </motion.div>
  )
}

// ─── Session runner ───────────────────────────────────────────────────────────

// Rotate through all 4 exercise types intelligently
function pickExerciseType(word, index, allWords) {
  const hasFill = !!(word.fill_in_blank_sentence || word.example_sentence_1)
  const hasMulti = allWords.length >= 4

  const available = ['flashcard']
  if (hasMulti) available.push('multiple_choice')
  if (hasFill)  available.push('fill_blank')
  available.push('type_word')

  return available[index % available.length]
}

function SessionRunner({ onEnd }) {
  const { profile }                                        = useAuthStore()
  const { words, buildSessionQueue, recordAnswer, awardXP, updateStreak } = useUserStore()

  const [queue,      setQueue]     = useState([])
  const [index,      setIndex]     = useState(0)
  const [hearts,     setHearts]    = useState(5)
  const [totalXP,    setTotalXP]   = useState(0)
  const [correct,    setCorrect]   = useState(0)
  const [xpFloats,   setXPFloats]  = useState([])
  const [feedback,   setFeedback]  = useState(null) // 'correct' | 'wrong'
  const [done,       setDone]      = useState(false)
  const [exType,     setExType]    = useState('flashcard')

  useEffect(() => {
    const q = buildSessionQueue(profile?.daily_goal || 10)
    setQueue(q)
    if (q.length > 0) setExType(pickExerciseType(q[0], 0, words))
  }, [])

  const addXPFloat = (amount) => {
    const id = Date.now()
    setXPFloats(f => [...f, { id, amount }])
    setTotalXP(t => t + amount)
  }

  const handleAnswer = useCallback(async (isCorrect) => {
    const word = queue[index]
    if (!word) return

    // Flash feedback
    setFeedback(isCorrect ? 'correct' : 'wrong')
    setTimeout(() => setFeedback(null), 400)

    // Record mastery
    await recordAnswer(word, isCorrect)

    if (isCorrect) {
      addXPFloat(XP_CORRECT)
      setCorrect(c => c + 1)
    } else {
      setHearts(h => Math.max(0, h - 1))
    }

    const nextIndex = index + 1
    if (nextIndex >= queue.length) {
      // Session complete — award XP + update leaderboard
      const finalXP = totalXP + (isCorrect ? XP_CORRECT : 0)
      if (profile?.id) {
        await awardXP(profile.id, finalXP)
        await updateStreak(profile.id)
        await writeToLeaderboard(profile.id, finalXP)
      }
      setDone(true)
    } else {
      setIndex(nextIndex)
      setExType(pickExerciseType(queue[nextIndex], nextIndex, words))
    }
  }, [queue, index, totalXP, profile])

  const currentWord = queue[index]

  if (queue.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 32 }}>
        <BookOpen size={48} color="var(--c-border)" style={{ marginBottom: 16 }} />
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--c-text)', marginBottom: 8 }}>
          No words to practice
        </div>
        <div style={{ fontSize: 14, color: 'var(--c-text-muted)', marginBottom: 24 }}>
          Add words to your vocab bank first
        </div>
        <button onClick={onEnd} style={{ background: 'var(--c-primary)', color: '#fff', border: 'none', borderRadius: 'var(--r-sm)', padding: '12px 28px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          Go to Vocab Bank
        </button>
      </div>
    )
  }

  if (done) {
    return (
      <SessionSummary
        xp={totalXP}
        correct={correct}
        total={queue.length}
        streak={profile?.current_streak || 0}
        onDone={onEnd}
      />
    )
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Session header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Hearts count={hearts} />
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-text-muted)' }}>
          {index + 1}/{queue.length}
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          fontSize: 13, fontWeight: 700, color: 'var(--c-gold)',
          background: 'var(--c-gold-pale)', padding: '4px 12px',
          borderRadius: 99, border: '1px solid var(--c-gold-light)',
        }}>
          <Zap size={12} fill="var(--c-gold)" color="var(--c-gold)" />
          {totalXP} XP
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, background: 'var(--c-border)', borderRadius: 2, overflow: 'hidden' }}>
        <motion.div
          animate={{ width: `${(index / queue.length) * 100}%` }}
          transition={{ duration: 0.35 }}
          style={{ height: '100%', background: 'var(--c-primary)', borderRadius: 2 }}
        />
      </div>

      {/* Exercise type label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {exType === 'flashcard'       && <><Layers size={13} color="var(--c-text-muted)" /><span style={{ fontSize: 11, color: 'var(--c-text-muted)', fontWeight: 500 }}>Flashcard</span></>}
        {exType === 'multiple_choice' && <><BookOpen size={13} color="var(--c-text-muted)" /><span style={{ fontSize: 11, color: 'var(--c-text-muted)', fontWeight: 500 }}>Multiple choice</span></>}
        {exType === 'fill_blank'      && <><PenLine size={13} color="var(--c-text-muted)" /><span style={{ fontSize: 11, color: 'var(--c-text-muted)', fontWeight: 500 }}>Fill in the blank</span></>}
        {exType === 'type_word'       && <><Type size={13} color="var(--c-text-muted)" /><span style={{ fontSize: 11, color: 'var(--c-text-muted)', fontWeight: 500 }}>Type the word</span></>}
      </div>

      {/* Exercise */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${index}-${exType}`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.18 }}
          style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
        >
          {exType === 'flashcard' && (
            <Flashcard word={currentWord} onRate={handleAnswer} />
          )}
          {exType === 'multiple_choice' && (
            <MultipleChoice word={currentWord} allWords={words} onAnswer={handleAnswer} />
          )}
          {exType === 'fill_blank' && (
            <FillInBlank key={index} word={currentWord} onAnswer={handleAnswer} />
          )}
          {exType === 'type_word' && (
            <TypeTheWord key={index} word={currentWord} onAnswer={handleAnswer} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Feedback flash */}
      <AnimatePresence>
        {feedback && <AnswerFeedback key={feedback + index} correct={feedback === 'correct'} />}
      </AnimatePresence>

      {/* XP floats */}
      <AnimatePresence>
        {xpFloats.map(({ id, amount }) => (
          <XPFloat key={id} amount={amount} onDone={() => setXPFloats(f => f.filter(x => x.id !== id))} />
        ))}
      </AnimatePresence>
    </div>
  )
}

// ─── Learn page ───────────────────────────────────────────────────────────────

const TABS = [
  { value: 'session', label: 'Session',   icon: <Zap size={14} /> },
  { value: 'bank',    label: 'Vocab Bank', icon: <BookOpen size={14} /> },
  { value: 'story',   label: 'Story',     icon: <Layers size={14} /> },
]

export function Learn() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = searchParams.get('tab') || 'session'
  const [tab,           setTab]           = useState(initialTab)
  const [sessionActive, setSessionActive] = useState(false)

  const switchTab = (t) => {
    setTab(t)
    setSearchParams(t !== 'session' ? { tab: t } : {})
  }

  return (
    <div style={{ paddingTop: 20, display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 80px)' }}>

      {/* Tab bar — hide during active session */}
      {!sessionActive && (
        <div style={{
          display: 'flex', background: 'var(--c-bg-subtle)',
          borderRadius: 'var(--r-sm)', padding: 4, marginBottom: 20,
        }}>
          {TABS.map(({ value, label, icon }) => (
            <button
              key={value}
              onClick={() => switchTab(value)}
              style={{
                flex: 1, padding: '9px 4px',
                fontSize: 13, fontWeight: 600,
                borderRadius: 6, border: 'none', cursor: 'pointer',
                transition: 'all 0.15s ease',
                background: tab === value ? 'var(--c-bg)' : 'transparent',
                color: tab === value ? 'var(--c-primary)' : 'var(--c-text-muted)',
                boxShadow: tab === value ? 'var(--shadow-sm)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              }}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {tab === 'session' && (
          <motion.div key="session" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {sessionActive
              ? <SessionRunner onEnd={() => setSessionActive(false)} />
              : <SessionLobby onStart={() => setSessionActive(true)} />
            }
          </motion.div>
        )}
        {tab === 'bank' && (
          <motion.div key="bank" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <VocabBank />
          </motion.div>
        )}
        {tab === 'story' && (
          <motion.div key="story" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <StoryMode onExit={() => switchTab('session')} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}