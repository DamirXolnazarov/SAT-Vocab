import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../stores/authStore'
import { useUserStore } from '../stores/userStore'

// ─── Constants ────────────────────────────────────────────────────────────────

const QUESTION_COUNT  = 10
const TIME_PER_Q      = 20
const WIN_THRESHOLD   = 7
const XP_WIN          = 100
const XP_ATTEMPT      = 30

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5)
}

function buildQuestion(word, allWords) {
  const types = ['multiple_choice', 'definition_match', 'fill_blank']
  // Only use fill_blank if sentence exists
  const available = word.fill_in_blank_sentence
    ? types
    : types.filter(t => t !== 'fill_blank')
  const type = available[Math.floor(Math.random() * available.length)]

  if (type === 'fill_blank') {
    return {
      type,
      word: word.word,
      wordId: word.id,
      sentence: word.fill_in_blank_sentence,
      answer: word.word,
    }
  }

  // Multiple choice / definition match — both use 4-option format
  const distractors = shuffle(allWords.filter(w => w.id !== word.id))
    .slice(0, 3)
    .map(w => w.definition)
  const options = shuffle([word.definition, ...distractors])
  return {
    type,
    word:        word.word,
    wordId:      word.id,
    definition:  word.definition,
    options,
    correctIndex: options.indexOf(word.definition),
  }
}

// ─── Timer ring ───────────────────────────────────────────────────────────────

function TimerRing({ timeLeft, total }) {
  const r     = 26
  const circ  = 2 * Math.PI * r
  const pct   = timeLeft / total
  const dash  = pct * circ
  const color = timeLeft <= 5 ? 'var(--c-danger)' : timeLeft <= 10 ? 'var(--c-warning)' : '#fff'

  return (
    <div style={{ position: 'relative', width: 64, height: 64 }}>
      <svg width="64" height="64" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={r}
          fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="4" />
        <motion.circle cx="32" cy="32" r={r}
          fill="none" stroke={color} strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ - dash}
          transform="rotate(-90 32 32)"
          transition={{ duration: 0.3 }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18, fontWeight: 800, color,
      }}>
        {timeLeft}
      </div>
    </div>
  )
}

// ─── Multiple choice question ─────────────────────────────────────────────────

function MCQuestion({ question, onAnswer }) {
  const [selected, setSelected] = useState(null)

  const handleSelect = (i) => {
    if (selected !== null) return
    setSelected(i)
    const correct = i === question.correctIndex
    setTimeout(() => onAnswer(correct), 700)
  }

  const getStyle = (i) => {
    const base = {
      width: '100%', minHeight: 54, padding: '12px 16px',
      textAlign: 'left', borderRadius: 'var(--r-sm)',
      fontSize: 14, lineHeight: 1.5, fontWeight: 500,
      border: '1.5px solid', cursor: selected !== null ? 'default' : 'pointer',
      transition: 'all 0.15s ease',
    }
    if (selected === null) {
      return { ...base, background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.2)', color: '#fff' }
    }
    if (i === question.correctIndex) {
      return { ...base, background: 'var(--c-success)', borderColor: 'var(--c-success)', color: '#fff' }
    }
    if (i === selected) {
      return { ...base, background: 'var(--c-danger)', borderColor: 'var(--c-danger)', color: '#fff' }
    }
    return { ...base, background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {question.options.map((opt, i) => (
        <motion.button
          key={i}
          whileTap={selected === null ? { scale: 0.98 } : {}}
          onClick={() => handleSelect(i)}
          style={getStyle(i)}
        >
          <span style={{ marginRight: 10, opacity: 0.6, fontWeight: 700 }}>
            {['A', 'B', 'C', 'D'][i]}
          </span>
          {opt}
        </motion.button>
      ))}
    </div>
  )
}

// ─── Fill in blank question ───────────────────────────────────────────────────

function FillBlankQuestion({ question, onAnswer }) {
  const [input,    setInput]    = useState('')
  const [result,   setResult]   = useState(null) // 'correct' | 'wrong'
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const handleSubmit = () => {
    if (result || !input.trim()) return
    const userAnswer = input.trim().toLowerCase()
    const correct    = question.answer.toLowerCase()

    // Typo tolerance: 1 char diff = warning, 2+ = wrong
    const dist = levenshtein(userAnswer, correct)
    const isCorrect = dist === 0 || dist === 1

    setResult(isCorrect ? 'correct' : 'wrong')
    setTimeout(() => onAnswer(isCorrect), 800)
  }

  const displaySentence = question.sentence?.replace('[BLANK]', '________') || '________'

  return (
    <div>
      <div style={{
        fontSize: 16, color: 'rgba(255,255,255,0.9)',
        lineHeight: 1.7, marginBottom: 20, fontStyle: 'italic',
        background: 'rgba(255,255,255,0.08)',
        borderRadius: 'var(--r-sm)', padding: '14px 16px',
      }}>
        {displaySentence}
      </div>
      <input
        ref={inputRef}
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        disabled={!!result}
        placeholder="Type the word…"
        style={{
          width: '100%', padding: '14px 16px', minHeight: 52,
          background: result === 'correct'
            ? 'var(--c-success)'
            : result === 'wrong'
            ? 'var(--c-danger)'
            : 'rgba(255,255,255,0.12)',
          border: `1.5px solid ${result ? 'transparent' : 'rgba(255,255,255,0.3)'}`,
          borderRadius: 'var(--r-sm)',
          fontSize: 18, fontWeight: 600,
          color: '#fff', outline: 'none',
          boxSizing: 'border-box',
          transition: 'background 0.2s',
          caretColor: '#fff',
        }}
      />
      {!result && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSubmit}
          style={{
            width: '100%', minHeight: 48, marginTop: 10,
            background: 'rgba(255,255,255,0.15)',
            border: '1.5px solid rgba(255,255,255,0.3)',
            borderRadius: 'var(--r-sm)',
            color: '#fff', fontSize: 15, fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Submit ↵
        </motion.button>
      )}
    </div>
  )
}

// ─── Levenshtein distance (typo tolerance) ────────────────────────────────────

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

// ─── Result screen ────────────────────────────────────────────────────────────

function BossResult({ score, words, xp, onDone, onRetry }) {
  const won = score >= WIN_THRESHOLD

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '24px 20px',
      }}
    >
      {/* Trophy or skull */}
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', damping: 14, stiffness: 200, delay: 0.1 }}
        style={{ fontSize: 72, marginBottom: 16 }}
      >
        {won ? '🏆' : '💀'}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', marginBottom: 6 }}>
          {won ? 'Boss Defeated!' : 'Defeated…'}
        </div>
        <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)', marginBottom: 28 }}>
          {won
            ? `You crushed it with ${score}/${QUESTION_COUNT} correct!`
            : `${score}/${QUESTION_COUNT} correct — you need ${WIN_THRESHOLD} to win`}
        </div>
      </motion.div>

      {/* Score breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{
          display: 'flex', gap: 14, marginBottom: 28, width: '100%',
        }}
      >
        {[
          { emoji: '✅', label: 'Correct',  value: score                    },
          { emoji: '❌', label: 'Wrong',    value: QUESTION_COUNT - score   },
          { emoji: '⚡', label: 'XP',       value: `+${xp}`                 },
        ].map(({ emoji, label, value }) => (
          <div key={label} style={{
            flex: 1, padding: '14px 8px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 'var(--r-card)',
            border: '1px solid rgba(255,255,255,0.15)',
          }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>{emoji}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>{value}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{label}</div>
          </div>
        ))}
      </motion.div>

      {/* Word results mini-list */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        style={{ width: '100%', marginBottom: 28 }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {words.map(({ word, correct }, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 12px',
              background: correct
                ? 'rgba(29,158,117,0.15)'
                : 'rgba(216,90,48,0.15)',
              borderRadius: 'var(--r-sm)',
              border: `1px solid ${correct ? 'rgba(29,158,117,0.3)' : 'rgba(216,90,48,0.3)'}`,
            }}>
              <span style={{ fontSize: 16 }}>{correct ? '✅' : '❌'}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#fff', flex: 1 }}>{word}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* CTA buttons */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        style={{ display: 'flex', gap: 10, width: '100%' }}
      >
        {!won && (
          <button
            onClick={onRetry}
            style={{
              flex: 1, minHeight: 52,
              background: 'rgba(255,255,255,0.15)',
              border: '1.5px solid rgba(255,255,255,0.3)',
              borderRadius: 'var(--r-sm)',
              color: '#fff', fontSize: 15, fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        )}
        <button
          onClick={onDone}
          style={{
            flex: 2, minHeight: 52,
            background: won ? 'var(--c-gold)' : '#fff',
            border: 'none', borderRadius: 'var(--r-sm)',
            color: won ? '#fff' : 'var(--c-primary)',
            fontSize: 15, fontWeight: 700, cursor: 'pointer',
          }}
        >
          {won ? '🏆 Claim reward' : 'Back to learning'}
        </button>
      </motion.div>
    </motion.div>
  )
}

// ─── Boss Battle ──────────────────────────────────────────────────────────────

export function BossBattle({ onExit }) {
  const { profile }              = useAuthStore()
  const { words, awardXP }       = useUserStore()

  const [phase,     setPhase]    = useState('intro')    // intro | battle | result
  const [questions, setQuestions] = useState([])
  const [qIndex,    setQIndex]   = useState(0)
  const [timeLeft,  setTimeLeft] = useState(TIME_PER_Q)
  const [answers,   setAnswers]  = useState([])         // [{word, correct}]
  const [score,     setScore]    = useState(0)
  const [earnedXP,  setEarnedXP] = useState(0)

  const timerRef = useRef(null)

  // ── Build questions ────────────────────────────────────────────────
  const initBattle = useCallback(() => {
    const pool = shuffle(words).slice(0, QUESTION_COUNT)
    // If not enough words, repeat
    const padded = pool.length >= QUESTION_COUNT
      ? pool
      : [...pool, ...shuffle(words)].slice(0, QUESTION_COUNT)

    setQuestions(padded.map(w => buildQuestion(w, words)))
    setQIndex(0)
    setTimeLeft(TIME_PER_Q)
    setAnswers([])
    setScore(0)
    setPhase('battle')
  }, [words])

  // ── Timer ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'battle') return
    clearInterval(timerRef.current)

    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current)
          handleAnswer(false, true) // timeout = wrong
          return TIME_PER_Q
        }
        return t - 1
      })
    }, 1000)

    return () => clearInterval(timerRef.current)
  }, [phase, qIndex])

  // ── Answer handler ─────────────────────────────────────────────────
  const handleAnswer = useCallback((correct, timeout = false) => {
    clearInterval(timerRef.current)

    const q = questions[qIndex]
    if (!q) return

    const newAnswers = [...answers, { word: q.word, correct }]
    const newScore   = score + (correct ? 1 : 0)

    setAnswers(newAnswers)
    setScore(newScore)

    const nextIndex = qIndex + 1

    if (nextIndex >= QUESTION_COUNT) {
      // Battle done
      const xp = newScore >= WIN_THRESHOLD ? XP_WIN : XP_ATTEMPT
      setEarnedXP(xp)
      if (profile?.id) awardXP(profile.id, xp)
      setPhase('result')
    } else {
      setQIndex(nextIndex)
      setTimeLeft(TIME_PER_Q)
    }
  }, [questions, qIndex, answers, score, profile])

  const currentQ = questions[qIndex]

  // ─────────────────────────────────────────────────────────────────
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 90,
      background: 'linear-gradient(160deg, #5c111e 0%, #8b1a2e 50%, #3d0a15 100%)',
      display: 'flex', flexDirection: 'column',
      overflowY: 'auto',
    }}>

      {/* ── INTRO ── */}
      <AnimatePresence mode="wait">
        {phase === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '32px 24px', textAlign: 'center',
            }}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 14 }}
              style={{ fontSize: 80, marginBottom: 20 }}
            >
              👹
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', marginBottom: 8, letterSpacing: '-0.5px' }}>
                Boss Battle
              </div>
              <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)', marginBottom: 32, lineHeight: 1.6 }}>
                10 questions · 20 seconds each · No hearts
              </div>
            </motion.div>

            {/* Rules */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              style={{
                width: '100%', maxWidth: 360,
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 'var(--r-card)',
                padding: '20px',
                marginBottom: 32, textAlign: 'left',
              }}
            >
              {[
                { emoji: '⚡', text: `Win (${WIN_THRESHOLD}+/10): +${XP_WIN} XP` },
                { emoji: '🎯', text: `Attempt (under ${WIN_THRESHOLD}/10): +${XP_ATTEMPT} XP` },
                { emoji: '⏱️', text: 'Time out = wrong answer' },
                { emoji: '🃏', text: 'Mix of multiple choice + fill in blank' },
              ].map(({ emoji, text }) => (
                <div key={text} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  marginBottom: 12,
                }}>
                  <span style={{ fontSize: 20 }}>{emoji}</span>
                  <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>{text}</span>
                </div>
              ))}
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              whileTap={{ scale: 0.97 }}
              onClick={words.length >= 5 ? initBattle : undefined}
              disabled={words.length < 5}
              style={{
                width: '100%', maxWidth: 360, minHeight: 56,
                background: words.length >= 5 ? 'var(--c-gold)' : 'rgba(255,255,255,0.15)',
                border: 'none', borderRadius: 'var(--r-sm)',
                color: '#fff', fontSize: 17, fontWeight: 800,
                cursor: words.length >= 5 ? 'pointer' : 'not-allowed',
                letterSpacing: '0.02em',
              }}
            >
              {words.length >= 5 ? '⚔️ Fight!' : `Need ${5 - words.length} more words`}
            </motion.button>

            {/* Exit */}
            <button
              onClick={onExit}
              style={{
                background: 'none', border: 'none',
                color: 'rgba(255,255,255,0.4)', fontSize: 14,
                cursor: 'pointer', marginTop: 20,
              }}
            >
              ← Back to Learn
            </button>
          </motion.div>
        )}

        {/* ── BATTLE ── */}
        {phase === 'battle' && currentQ && (
          <motion.div
            key={`battle-${qIndex}`}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.2 }}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              padding: '20px 20px 32px',
              maxWidth: 560, margin: '0 auto', width: '100%',
            }}
          >
            {/* Battle header */}
            <div style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20,
            }}>
              {/* Progress dots */}
              <div style={{ display: 'flex', gap: 5 }}>
                {Array.from({ length: QUESTION_COUNT }, (_, i) => {
                  const ans = answers[i]
                  return (
                    <div key={i} style={{
                      width: i === qIndex ? 20 : 10,
                      height: 10, borderRadius: 5,
                      background: ans
                        ? (ans.correct ? 'var(--c-success)' : 'var(--c-danger)')
                        : i === qIndex
                        ? '#fff'
                        : 'rgba(255,255,255,0.2)',
                      transition: 'all 0.3s ease',
                    }} />
                  )
                })}
              </div>

              {/* Timer */}
              <TimerRing timeLeft={timeLeft} total={TIME_PER_Q} />
            </div>

            {/* Question type label */}
            <div style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
              color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase',
              marginBottom: 8,
            }}>
              {currentQ.type === 'fill_blank' ? 'Fill in the blank' : 'What does this mean?'}
            </div>

            {/* Word */}
            <div style={{
              fontSize: 34, fontWeight: 900, color: '#fff',
              letterSpacing: '-0.5px', marginBottom: 20, lineHeight: 1.1,
            }}>
              {currentQ.word}
            </div>

            {/* Question UI */}
            <div style={{ flex: 1 }}>
              {currentQ.type === 'fill_blank' ? (
                <FillBlankQuestion
                  key={qIndex}
                  question={currentQ}
                  onAnswer={handleAnswer}
                />
              ) : (
                <MCQuestion
                  key={qIndex}
                  question={currentQ}
                  onAnswer={handleAnswer}
                />
              )}
            </div>

            {/* Score running total */}
            <div style={{
              marginTop: 24, textAlign: 'center',
              fontSize: 13, color: 'rgba(255,255,255,0.4)',
            }}>
              {score} correct so far · need {Math.max(0, WIN_THRESHOLD - score)} more to win
            </div>
          </motion.div>
        )}

        {/* ── RESULT ── */}
        {phase === 'result' && (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              padding: '20px 20px 32px',
              maxWidth: 560, margin: '0 auto', width: '100%',
            }}
          >
            <BossResult
              score={score}
              words={answers}
              xp={earnedXP}
              onDone={onExit}
              onRetry={() => {
                setPhase('intro')
                setAnswers([])
                setScore(0)
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}