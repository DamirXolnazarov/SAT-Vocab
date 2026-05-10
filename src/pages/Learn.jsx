import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../stores/authStore'
import { useUserStore } from '../stores/userStore'
import { WordSearch } from '../components/WordSearch'
import { StoryMode } from './StoryMode'
import { VocabBank } from './VocabBank'

// ─── Hearts display ───────────────────────────────────────────────────────────

function Hearts({ count }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <motion.span
          key={i}
          animate={{ scale: i === count ? [1, 1.3, 1] : 1 }}
          style={{ fontSize: 18, opacity: i < count ? 1 : 0.2 }}
        >
          ❤️
        </motion.span>
      ))}
    </div>
  )
}

// ─── XP float animation ───────────────────────────────────────────────────────

function XPFloat({ xp, onDone }) {
  return (
    <motion.div
      initial={{ opacity: 1, y: 0 }}
      animate={{ opacity: 0, y: -40 }}
      transition={{ duration: 0.9, ease: 'easeOut' }}
      onAnimationComplete={onDone}
      style={{
        position: 'fixed', top: 80, right: 24, zIndex: 200,
        fontSize: 16, fontWeight: 800,
        color: 'var(--c-gold)',
        pointerEvents: 'none',
      }}
    >
      +{xp} XP ⚡
    </motion.div>
  )
}

// ─── Flashcard exercise ───────────────────────────────────────────────────────

function Flashcard({ word, onRate }) {
  const [flipped, setFlipped] = useState(false)

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Card */}
      <div
        onClick={() => setFlipped(f => !f)}
        style={{
          flex: 1, minHeight: 280,
          background: 'var(--c-bg)',
          border: '1px solid var(--c-border)',
          borderRadius: 'var(--r-card)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: 32, textAlign: 'center',
          cursor: 'pointer',
          boxShadow: 'var(--shadow-md)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <span style={{
          position: 'absolute', top: 16, right: 16,
          fontSize: 11, color: 'var(--c-text-muted)',
        }}>
          {flipped ? 'Definition' : 'Tap to reveal'}
        </span>

        <AnimatePresence mode="wait">
          {!flipped ? (
            <motion.div
              key="front"
              initial={{ opacity: 0, rotateY: -90 }}
              animate={{ opacity: 1, rotateY: 0 }}
              exit={{ opacity: 0, rotateY: 90 }}
              transition={{ duration: 0.25 }}
              style={{ textAlign: 'center' }}
            >
              <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--c-text)', marginBottom: 8 }}>
                {SAMPLE_WORD.word}
              </div>
              {word.pronunciation && (
                <div style={{ fontSize: 14, color: 'var(--c-text-muted)', marginBottom: 6 }}>
                  {SAMPLE_WORD.pronunciation}
                </div>
              )}
              {word.part_of_speech && (
                <div style={{ fontSize: 12, color: 'var(--c-primary)', fontWeight: 500 }}>
                  {SAMPLE_WORD.part_of_speech}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="back"
              initial={{ opacity: 0, rotateY: 90 }}
              animate={{ opacity: 1, rotateY: 0 }}
              exit={{ opacity: 0, rotateY: -90 }}
              transition={{ duration: 0.25 }}
              style={{ textAlign: 'center' }}
            >
              <div style={{ fontSize: 16, color: 'var(--c-text)', lineHeight: 1.7, marginBottom: 16 }}>
                {SAMPLE_WORD.definition}
              </div>
              {SAMPLE_WORD.example_sentence_1 && (
                <div style={{
                  fontSize: 13, color: 'var(--c-text-muted)',
                  fontStyle: 'italic', lineHeight: 1.5,
                  padding: '10px 16px',
                  background: 'var(--c-bg-subtle)',
                  borderRadius: 'var(--r-sm)',
                }}>
                  "{SAMPLE_WORD.example_sentence_1}"
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Rate buttons — only after flip */}
      <AnimatePresence>
        {flipped && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', gap: 12 }}
          >
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => onRate(false)}
              style={{
                flex: 1, minHeight: 52,
                background: 'var(--c-danger-pale)', color: 'var(--c-danger)',
                border: '1.5px solid var(--c-danger)',
                borderRadius: 'var(--r-sm)',
                fontSize: 15, fontWeight: 600, cursor: 'pointer',
              }}
            >
              😕 Hard
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => onRate(true)}
              style={{
                flex: 1, minHeight: 52,
                background: 'var(--c-success-pale)', color: 'var(--c-success)',
                border: '1.5px solid var(--c-success)',
                borderRadius: 'var(--r-sm)',
                fontSize: 15, fontWeight: 600, cursor: 'pointer',
              }}
            >
              😊 Easy
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Multiple choice exercise ─────────────────────────────────────────────────

function MultipleChoice({ word, allWords, onAnswer }) {
  const [selected, setSelected] = useState(null)

  // Build 4 options: 1 correct + 3 random wrong definitions
  const options = (() => {
    const wrong = allWords
      .filter(w => w.id !== word.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(w => ({ text: w.definition, correct: false }))
    const all = [{ text: word.definition, correct: true }, ...wrong]
      .sort(() => Math.random() - 0.5)
    return all
  })()

  const handleSelect = (i) => {
    if (selected !== null) return
    setSelected(i)
    setTimeout(() => onAnswer(options[i].correct), 900)
  }

  const getOptionStyle = (i) => {
    const base = {
      width: '100%', minHeight: 52, padding: '12px 16px',
      textAlign: 'left', borderRadius: 'var(--r-sm)',
      fontSize: 14, lineHeight: 1.5, cursor: selected !== null ? 'default' : 'pointer',
      border: '1.5px solid', transition: 'all 0.15s ease',
      fontWeight: 500,
    }
    if (selected === null) {
      return { ...base, background: 'var(--c-bg)', borderColor: 'var(--c-border)', color: 'var(--c-text)' }
    }
    if (options[i].correct) {
      return { ...base, background: 'var(--c-success-pale)', borderColor: 'var(--c-success)', color: 'var(--c-success)' }
    }
    if (i === selected) {
      return { ...base, background: 'var(--c-danger-pale)', borderColor: 'var(--c-danger)', color: 'var(--c-danger)' }
    }
    return { ...base, background: 'var(--c-bg)', borderColor: 'var(--c-border)', color: 'var(--c-text-muted)', opacity: 0.5 }
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Word prompt */}
      <div style={{
        background: 'var(--c-bg)', border: '1px solid var(--c-border)',
        borderRadius: 'var(--r-card)', padding: '24px', textAlign: 'center',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{ fontSize: 11, color: 'var(--c-text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          What does this word mean?
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--c-text)' }}>
          {word.word}
        </div>
        {word.pronunciation && (
          <div style={{ fontSize: 13, color: 'var(--c-text-muted)', marginTop: 6 }}>
            {word.pronunciation}
          </div>
        )}
      </div>

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {options.map((opt, i) => (
          <motion.button
            key={i}
            whileTap={selected === null ? { scale: 0.98 } : {}}
            onClick={() => handleSelect(i)}
            style={getOptionStyle(i)}
          >
            <span style={{ marginRight: 10, fontWeight: 700, color: 'var(--c-text-muted)' }}>
              {['A', 'B', 'C', 'D'][i]}
            </span>
            {opt.text}
          </motion.button>
        ))}
      </div>
    </div>
  )
}

// ─── Session summary screen ───────────────────────────────────────────────────

function SessionSummary({ xp, wordsCount, streak, onDone }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '20px',
      }}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.1 }}
        style={{ fontSize: 64, marginBottom: 16 }}
      >
        🎉
      </motion.div>

      <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--c-text)', marginBottom: 6 }}>
        Session complete!
      </h2>
      <p style={{ fontSize: 15, color: 'var(--c-text-muted)', marginBottom: 32 }}>
        Great work — keep the momentum going!
      </p>

      <div style={{ display: 'flex', gap: 14, marginBottom: 32 }}>
        {[
          { emoji: '⚡', value: `+${xp}`, label: 'XP earned' },
          { emoji: '📚', value: wordsCount, label: 'Words practiced' },
          { emoji: '🔥', value: streak, label: 'Day streak' },
        ].map(({ emoji, value, label }) => (
          <div key={label} style={{
            flex: 1, textAlign: 'center',
            background: 'var(--c-bg)',
            border: '1px solid var(--c-border)',
            borderRadius: 'var(--r-card)', padding: '16px 10px',
          }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{emoji}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--c-primary)' }}>{value}</div>
            <div style={{ fontSize: 11, color: 'var(--c-text-muted)' }}>{label}</div>
          </div>
        ))}
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onDone}
        style={{
          width: '100%', minHeight: 52,
          background: 'var(--c-primary)', color: '#fff',
          border: 'none', borderRadius: 'var(--r-sm)',
          fontSize: 16, fontWeight: 700, cursor: 'pointer',
        }}
      >
        Continue →
      </motion.button>
    </motion.div>
  )
}

// ─── Session runner ───────────────────────────────────────────────────────────

function SessionRunner({ onEnd }) {
  const { profile } = useAuthStore()
  const { words, buildSessionQueue, recordAnswer, awardXP, updateStreak, startSession, endSession, addXPToSession } = useUserStore()

  const [queue,       setQueue]       = useState([])
  const [index,       setIndex]       = useState(0)
  const [hearts,      setHearts]      = useState(5)
  const [totalXP,     setTotalXP]     = useState(0)
  const [xpFloats,    setXPFloats]    = useState([])
  const [exerciseType, setExType]     = useState('flashcard')
  const [done,        setDone]        = useState(false)
  const [sessionId,   setSessionId]   = useState(null)
  const [streak,      setStreak]      = useState(profile?.current_streak || 0)

  useEffect(() => {
    const q = buildSessionQueue(profile?.daily_goal || 10)
    setQueue(q)
    // Alternate: first word flashcard, second MC, etc.
    if (profile?.id) {
      startSession(profile.id).then(s => setSessionId(s?.id))
    }
  }, [])

  const currentWord = queue[index]

  const addXP = (amount) => {
    const id = Date.now()
    setXPFloats(f => [...f, { id, amount }])
    setTotalXP(t => t + amount)
    addXPToSession(amount)
  }

  const nextWord = async (isCorrect) => {
    if (!currentWord) return

    // Record answer in DB
    await recordAnswer(currentWord, isCorrect)

    // XP
    addXP(10)

    if (!isCorrect && exerciseType !== 'flashcard') {
      setHearts(h => Math.max(0, h - 1))
    }

    const nextIndex = index + 1
    if (nextIndex >= queue.length) {
      // End session
      if (sessionId) {
        await endSession({
          xp_earned:        totalXP + 10,
          words_practiced:  queue.map(w => w.id),
          hearts_remaining: hearts,
          daily_goal_hit:   queue.length >= (profile?.daily_goal || 10),
        })
      }
      if (profile?.id) {
        await awardXP(profile.id, totalXP + 10)
        await updateStreak(profile.id)
      }
      setDone(true)
    } else {
      setIndex(nextIndex)
      // Alternate exercise types
      setExType(exerciseType === 'flashcard' && words.length >= 4 ? 'multiple_choice' : 'flashcard')
    }
  }

  if (queue.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--c-text)', marginBottom: 8 }}>
          No words to practice
        </div>
        <div style={{ fontSize: 14, color: 'var(--c-text-muted)', marginBottom: 24 }}>
          Add words to your vocab bank first
        </div>
        <button
          onClick={onEnd}
          style={{
            background: 'var(--c-primary)', color: '#fff',
            border: 'none', borderRadius: 'var(--r-sm)',
            padding: '12px 28px', fontSize: 15, fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Go to Vocab Bank
        </button>
      </div>
    )
  }

  if (done) {
    return (
      <SessionSummary
        xp={totalXP}
        wordsCount={queue.length}
        streak={streak}
        onDone={onEnd}
      />
    )
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Session header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Hearts count={hearts} />
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-text-muted)' }}>
          {index + 1} / {queue.length}
        </div>
        <div style={{
          fontSize: 13, fontWeight: 700, color: 'var(--c-gold)',
          background: 'var(--c-gold-pale)', padding: '4px 12px',
          borderRadius: 99, border: '1px solid var(--c-gold-light)',
        }}>
          ⚡ {totalXP} XP
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, background: 'var(--c-border)', borderRadius: 2, overflow: 'hidden' }}>
        <motion.div
          animate={{ width: `${((index) / queue.length) * 100}%` }}
          transition={{ duration: 0.4 }}
          style={{ height: '100%', background: 'var(--c-primary)', borderRadius: 2 }}
        />
      </div>

      {/* Exercise */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${index}-${exerciseType}`}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.2 }}
          style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
        >
          {exerciseType === 'flashcard' ? (
            <Flashcard word={currentWord} onRate={nextWord} />
          ) : (
            <MultipleChoice word={currentWord} allWords={words} onAnswer={nextWord} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* XP floats */}
      <AnimatePresence>
        {xpFloats.map(({ id, amount }) => (
          <XPFloat key={id} xp={amount} onDone={() => setXPFloats(f => f.filter(x => x.id !== id))} />
        ))}
      </AnimatePresence>
    </div>
  )
}

// ─── Learn page ───────────────────────────────────────────────────────────────

const TABS = [
  { value: 'session', label: '⚡ Session' },
  { value: 'bank',    label: '📖 Vocab Bank' },
  { value: 'story', label: '📰 Story Mode' }
]

export function Learn() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = searchParams.get('tab') === 'bank' ? 'bank' : 'session'
  const [tab, setTab] = useState(initialTab)
  const [sessionActive, setSessionActive] = useState(false)

  const switchTab = (t) => {
    setTab(t)
    setSearchParams(t === 'bank' ? { tab: 'bank' } : {})
  }

  return (
    <div style={{ paddingTop: 20, display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 80px)' }}>
      {/* Tab bar */}
      {!sessionActive && (
        <div style={{
          display: 'flex', background: 'var(--c-bg-subtle)',
          borderRadius: 'var(--r-sm)', padding: 4, marginBottom: 20,
        }}>
          {TABS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => switchTab(value)}
              style={{
                flex: 1, padding: '9px 0',
                fontSize: 14, fontWeight: 600,
                borderRadius: 6, border: 'none', cursor: 'pointer',
                transition: 'all 0.15s ease',
                background: tab === value ? 'var(--c-bg)' : 'transparent',
                color: tab === value ? 'var(--c-primary)' : 'var(--c-text-muted)',
                boxShadow: tab === value ? 'var(--shadow-sm)' : 'none',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {tab === 'session' ? (
          <motion.div
            key="session"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
          >
            {sessionActive ? (
              <SessionRunner onEnd={() => setSessionActive(false)} />
            ) : (
              <SessionLobby onStart={() => setSessionActive(true)} />
            )}
          </motion.div>
        ) : (
          <motion.div
            key="bank"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <VocabBank />
          </motion.div>
        )}
       {tab === 'story' && (
  <motion.div
    key="story"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
  >
    <StoryMode onExit={() => setTab('session')} />
  </motion.div>
)}
      </AnimatePresence>
    </div>
  )
}

// ─── Session lobby ────────────────────────────────────────────────────────────

function SessionLobby({ onStart }) {
  const { profile } = useAuthStore()
  const { words } = useUserStore()

  const dueCount  = words.filter(w => w.state !== 'mastered' && w.state !== 'new').length
  const newCount  = words.filter(w => w.state === 'new').length
  const totalDue  = Math.min(dueCount + Math.min(newCount, 3), profile?.daily_goal || 10)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      {/* Session info card */}
      <div style={{
        background: 'var(--c-primary)', borderRadius: 'var(--r-card)',
        padding: '24px', color: '#fff', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -20, right: -20, width: 120, height: 120,
          borderRadius: '50%', background: 'rgba(255,255,255,0.06)',
        }} />
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 6 }}>
          Today's session
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>
          {totalDue} words
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>
          {newCount > 0 ? `${Math.min(newCount, 3)} new · ` : ''}{dueCount} review
        </div>
      </div>

      {/* Session details */}
      <div style={{
        background: 'var(--c-bg)', border: '1px solid var(--c-border)',
        borderRadius: 'var(--r-card)', padding: 18,
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-text)', marginBottom: 14 }}>
          What to expect
        </div>
        {[
          { emoji: '🃏', text: 'Flashcards — flip to see definition, rate Easy or Hard' },
          { emoji: '🎯', text: 'Multiple choice — pick the correct definition' },
          { emoji: '❤️', text: '5 hearts per session — lose one for each wrong answer' },
          { emoji: '⚡', text: '+10 XP for every correct answer' },
        ].map(({ emoji, text }) => (
          <div key={text} style={{ display: 'flex', gap: 12, marginBottom: 10, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>{emoji}</span>
            <span style={{ fontSize: 13, color: 'var(--c-text-muted)', lineHeight: 1.5 }}>{text}</span>
          </div>
        ))}
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onStart}
        disabled={words.length === 0}
        style={{
          width: '100%', minHeight: 56,
          background: words.length === 0 ? 'var(--c-border)' : 'var(--c-primary)',
          color: '#fff', border: 'none', borderRadius: 'var(--r-sm)',
          fontSize: 17, fontWeight: 700,
          cursor: words.length === 0 ? 'not-allowed' : 'pointer',
          marginTop: 'auto',
        }}
      >
        {words.length === 0 ? 'Add words first →' : 'Start session ⚡'}
      </motion.button>
    </motion.div>
  )
}