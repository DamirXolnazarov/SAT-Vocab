import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { useUserStore } from '../stores/userStore'

const STORY_XP = 30

// ─── Quiz question ────────────────────────────────────────────────────────────

function QuizQuestion({ question, onAnswer }) {
  const [selected, setSelected] = useState(null)

  const handleSelect = (i) => {
    if (selected !== null) return
    setSelected(i)
    setTimeout(() => onAnswer(i === question.correctIndex), 700)
  }

  const getStyle = (i) => {
    const base = {
      width: '100%', minHeight: 52, padding: '12px 16px',
      textAlign: 'left', fontSize: 14, lineHeight: 1.5,
      fontWeight: 500, borderRadius: 'var(--r-sm)',
      border: '1.5px solid', cursor: selected !== null ? 'default' : 'pointer',
      transition: 'all 0.15s ease',
    }
    if (selected === null) return { ...base, background: 'var(--c-bg)', borderColor: 'var(--c-border)', color: 'var(--c-text)' }
    if (i === question.correctIndex) return { ...base, background: 'var(--c-success-pale)', borderColor: 'var(--c-success)', color: 'var(--c-success)' }
    if (i === selected) return { ...base, background: 'var(--c-danger-pale)', borderColor: 'var(--c-danger)', color: 'var(--c-danger)' }
    return { ...base, background: 'var(--c-bg)', borderColor: 'var(--c-border)', color: 'var(--c-text-muted)', opacity: 0.5 }
  }

  return (
    <div>
      <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--c-text)', marginBottom: 14, lineHeight: 1.5 }}>
        {question.question}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {question.options.map((opt, i) => (
          <motion.button key={i} whileTap={selected === null ? { scale: 0.98 } : {}} onClick={() => handleSelect(i)} style={getStyle(i)}>
            <span style={{ marginRight: 10, fontWeight: 700, color: 'var(--c-text-muted)', opacity: 0.7 }}>{['A','B','C','D'][i]}</span>
            {opt}
          </motion.button>
        ))}
      </div>
    </div>
  )
}

// ─── Story display ────────────────────────────────────────────────────────────

function StoryDisplay({ story, highlightedWords, onWordTap, revealedWords }) {
  if (!story) return null

  // Split story into segments, highlighting known words
  const parts = []
  let remaining = story
  let offset = 0

  const sorted = [...highlightedWords].sort((a, b) => a.start_index - b.start_index)

  sorted.forEach(({ word, start_index, end_index }) => {
    const relStart = start_index - offset
    const relEnd   = end_index - offset
    if (relStart > 0) parts.push({ text: remaining.slice(0, relStart), highlight: false })
    parts.push({ text: remaining.slice(relStart, relEnd), highlight: true, word })
    remaining = remaining.slice(relEnd)
    offset    = end_index
  })
  if (remaining) parts.push({ text: remaining, highlight: false })

  return (
    <div style={{
      fontSize: 16, lineHeight: 1.9, color: 'var(--c-text)',
      fontFamily: 'Georgia, "Times New Roman", serif',
    }}>
      {parts.map((part, i) =>
        part.highlight ? (
          <motion.span
            key={i}
            whileTap={{ scale: 0.95 }}
            onClick={() => onWordTap(part.word)}
            style={{
              display: 'inline',
              background: revealedWords.has(part.word)
                ? 'var(--c-success-pale)'
                : 'var(--c-primary-pale)',
              color: revealedWords.has(part.word)
                ? 'var(--c-success)'
                : 'var(--c-primary)',
              borderRadius: 4, padding: '1px 4px',
              cursor: 'pointer', fontWeight: 700,
              borderBottom: `2px solid ${revealedWords.has(part.word) ? 'var(--c-success)' : 'var(--c-primary)'}`,
              transition: 'all 0.2s ease',
            }}
          >
            {part.text}
          </motion.span>
        ) : (
          <span key={i}>{part.text}</span>
        )
      )}
    </div>
  )
}

// ─── Word popup ───────────────────────────────────────────────────────────────

function WordPopup({ word, wordData, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 520,
          background: 'var(--c-bg)',
          borderRadius: '20px 20px 0 0',
          padding: '20px 20px 36px',
        }}
      >
        <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--c-border)', margin: '0 auto 20px' }} />
        <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--c-text)', marginBottom: 4 }}>{word}</div>
        {wordData ? (
          <>
            <div style={{ fontSize: 12, color: 'var(--c-primary)', fontWeight: 500, marginBottom: 10 }}>{wordData.part_of_speech}</div>
            <p style={{ fontSize: 15, color: 'var(--c-text)', lineHeight: 1.65, marginBottom: 12 }}>{wordData.definition}</p>
            {wordData.mnemonic_hint && (
              <div style={{ background: 'var(--c-gold-pale)', border: '1px solid var(--c-gold-light)', borderRadius: 'var(--r-sm)', padding: '10px 12px' }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--c-gold)', marginBottom: 4 }}>💡 MEMORY TRICK</div>
                <div style={{ fontSize: 13, color: 'var(--c-text)', lineHeight: 1.5 }}>{wordData.mnemonic_hint}</div>
              </div>
            )}
          </>
        ) : (
          <div style={{ fontSize: 14, color: 'var(--c-text-muted)' }}>Loading definition…</div>
        )}
      </motion.div>
    </motion.div>
  )
}

// ─── StoryMode ────────────────────────────────────────────────────────────────

export function StoryMode({ onExit }) {
  const { profile }          = useAuthStore()
  const { words, awardXP }   = useUserStore()

  const [phase,          setPhase]         = useState('loading') // loading | story | quiz | result
  const [story,          setStory]         = useState('')
  const [highlighted,    setHighlighted]   = useState([])
  const [quizQuestions,  setQuizQuestions] = useState([])
  const [revealedWords,  setRevealedWords] = useState(new Set())
  const [activeWord,     setActiveWord]    = useState(null)
  const [activeWordData, setActiveWordData] = useState(null)
  const [quizIndex,      setQuizIndex]     = useState(0)
  const [quizScore,      setQuizScore]     = useState(0)
  const [error,          setError]         = useState('')

  useEffect(() => { generateStory() }, [])

  const generateStory = async () => {
    if (words.length < 3) { setError('You need at least 3 words to use Story Mode.'); setPhase('error'); return }
    setPhase('loading')
    try {
      const storyWords = words
        .filter(w => w.state !== 'mastered')
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.min(6, words.length))

      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/story-mode`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            words: storyWords.map(w => ({ word: w.word, definition: w.definition })),
          }),
        }
      )

      if (!res.ok) throw new Error('Failed to generate story')
      const json = await res.json()

      setStory(json.story || '')
      setHighlighted(json.highlighted_words || [])
      setQuizQuestions(json.questions || [])
      setPhase('story')
    } catch (err) {
      // Fallback: use a demo story if edge function not deployed yet
      setStory(getDemoStory(words))
      setHighlighted(getDemoHighlights(words))
      setQuizQuestions(getDemoQuiz(words))
      setPhase('story')
    }
  }

  const handleWordTap = async (word) => {
    setActiveWord(word)
    setRevealedWords(prev => new Set([...prev, word]))
    // Find word data
    const found = words.find(w => w.word.toLowerCase() === word.toLowerCase())
    setActiveWordData(found || null)
  }

  const handleQuizAnswer = (correct) => {
    const newScore = quizScore + (correct ? 1 : 0)
    setQuizScore(newScore)
    if (quizIndex + 1 >= quizQuestions.length) {
      if (profile?.id) awardXP(profile.id, STORY_XP)
      setPhase('result')
    } else {
      setQuizIndex(i => i + 1)
    }
  }

  // ── Demo fallbacks (when edge function not deployed) ──────────────
  const getDemoStory = (wordList) => {
    const w = wordList[0]
    return `The scholar was known for being ${w?.word?.toLowerCase() || 'brilliant'} in every sense. People came from far away to seek her wisdom. She had mastered the art of learning, spending years studying in quiet solitude. Her ${wordList[1]?.word?.toLowerCase() || 'dedication'} was unmatched. On the day of the great test, she remained calm and focused.`
  }
  const getDemoHighlights = (wordList) => wordList.slice(0, 2).map((w, i) => ({
    word: w.word, start_index: 30 + i * 80, end_index: 30 + i * 80 + w.word.length,
  }))
  const getDemoQuiz = (wordList) => wordList.slice(0, 3).map(w => ({
    question: `What does "${w.word}" mean in the story?`,
    options: [w.definition, 'Something unrelated', 'A type of food', 'A place'],
    correctIndex: 0,
  }))

  return (
    <div style={{ paddingTop: 20, paddingBottom: 32 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={onExit} style={{ background: 'none', border: 'none', color: 'var(--c-text-muted)', fontSize: 14, cursor: 'pointer', padding: 0 }}>
          ← Back
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--c-text)' }}>Story Mode</div>
          <div style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>Tap highlighted words to reveal definitions</div>
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-gold)', background: 'var(--c-gold-pale)', padding: '4px 12px', borderRadius: 99, border: '1px solid var(--c-gold-light)' }}>
          +{STORY_XP} XP
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Loading */}
        {phase === 'loading' && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ textAlign: 'center', padding: '60px 20px' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ width: 40, height: 40, border: '3px solid var(--c-border)', borderTopColor: 'var(--c-primary)', borderRadius: '50%', margin: '0 auto 16px' }} />
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--c-text)', marginBottom: 4 }}>Generating your story…</div>
            <div style={{ fontSize: 13, color: 'var(--c-text-muted)' }}>Weaving your words into a narrative</div>
          </motion.div>
        )}

        {/* Error */}
        {phase === 'error' && (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--c-text)', marginBottom: 6 }}>{error}</div>
            <button onClick={onExit} style={{ background: 'var(--c-primary)', color: '#fff', border: 'none', borderRadius: 'var(--r-sm)', padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Add more words
            </button>
          </motion.div>
        )}

        {/* Story */}
        {phase === 'story' && (
          <motion.div key="story" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {/* Legend */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 20, padding: '10px 14px', background: 'var(--c-primary-pale)', borderRadius: 'var(--r-sm)', border: '1px solid var(--c-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ display: 'inline-block', width: 16, height: 4, borderRadius: 2, background: 'var(--c-primary)' }} />
                <span style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>Tap to reveal</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ display: 'inline-block', width: 16, height: 4, borderRadius: 2, background: 'var(--c-success)' }} />
                <span style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>Revealed</span>
              </div>
            </div>

            <div style={{ background: 'var(--c-bg)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-card)', padding: '24px 20px', marginBottom: 24, boxShadow: 'var(--shadow-sm)' }}>
              <StoryDisplay story={story} highlightedWords={highlighted} onWordTap={handleWordTap} revealedWords={revealedWords} />
            </div>

            {/* Revealed count */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: 'var(--c-text-muted)' }}>
                {revealedWords.size} / {highlighted.length} words revealed
              </div>
              <div style={{ height: 6, width: 120, background: 'var(--c-border)', borderRadius: 3, overflow: 'hidden' }}>
                <motion.div
                  animate={{ width: `${highlighted.length > 0 ? (revealedWords.size / highlighted.length) * 100 : 0}%` }}
                  style={{ height: '100%', background: 'var(--c-success)', borderRadius: 3 }}
                />
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setPhase('quiz')}
              style={{ width: '100%', minHeight: 52, background: 'var(--c-primary)', color: '#fff', border: 'none', borderRadius: 'var(--r-sm)', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}
            >
              Take the quiz →
            </motion.button>
          </motion.div>
        )}

        {/* Quiz */}
        {phase === 'quiz' && quizQuestions.length > 0 && (
          <motion.div key={`quiz-${quizIndex}`} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <span style={{ fontSize: 13, color: 'var(--c-text-muted)' }}>Question {quizIndex + 1} of {quizQuestions.length}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-primary)' }}>No hearts lost</span>
            </div>
            <div style={{ height: 4, background: 'var(--c-border)', borderRadius: 2, overflow: 'hidden', marginBottom: 24 }}>
              <motion.div animate={{ width: `${((quizIndex) / quizQuestions.length) * 100}%` }} style={{ height: '100%', background: 'var(--c-primary)', borderRadius: 2 }} />
            </div>
            <QuizQuestion question={quizQuestions[quizIndex]} onAnswer={handleQuizAnswer} />
          </motion.div>
        )}

        {/* Result */}
        {phase === 'result' && (
          <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '20px 0' }}>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }} style={{ fontSize: 64, marginBottom: 16 }}>
              {quizScore === quizQuestions.length ? '🎉' : quizScore >= quizQuestions.length / 2 ? '👍' : '📖'}
            </motion.div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--c-text)', marginBottom: 6 }}>Story complete!</div>
            <div style={{ fontSize: 15, color: 'var(--c-text-muted)', marginBottom: 24 }}>
              {quizScore}/{quizQuestions.length} quiz questions correct
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 28 }}>
              {[
                { emoji: '📖', label: 'Story read', value: '✓' },
                { emoji: '🧠', label: 'Words revealed', value: revealedWords.size },
                { emoji: '⚡', label: 'XP earned', value: `+${STORY_XP}` },
              ].map(({ emoji, label, value }) => (
                <div key={label} style={{ flex: 1, padding: '14px 8px', background: 'var(--c-bg)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-card)', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, marginBottom: 4 }}>{emoji}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--c-primary)' }}>{value}</div>
                  <div style={{ fontSize: 10, color: 'var(--c-text-muted)' }}>{label}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={generateStory} style={{ flex: 1, minHeight: 48, background: 'var(--c-bg)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-sm)', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: 'var(--c-text)' }}>
                New story
              </button>
              <button onClick={onExit} style={{ flex: 2, minHeight: 48, background: 'var(--c-primary)', color: '#fff', border: 'none', borderRadius: 'var(--r-sm)', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                Done →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Word popup */}
      <AnimatePresence>
        {activeWord && (
          <WordPopup word={activeWord} wordData={activeWordData} onClose={() => { setActiveWord(null); setActiveWordData(null) }} />
        )}
      </AnimatePresence>
    </div>
  )
}