import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { useUserStore } from '../stores/userStore'

// ─── Fallback word if no words in DB ─────────────────────────────────────────

const FALLBACK = {
  word:           'Perspicacious',
  pronunciation:  '/ˌpɜːr.spɪˈkeɪ.ʃəs/',
  part_of_speech: 'adjective',
  definition:     'Having a ready insight into and understanding of things; shrewd.',
  example_sentence_1: 'Her perspicacious mind spotted the flaw that others had missed entirely.',
  mnemonic_hint:  'Per-SPIC — like spectacles, you see things with extra clarity.',
  synonyms:       ['shrewd', 'astute', 'perceptive', 'discerning', 'insightful'],
  antonyms:       ['obtuse', 'unperceptive', 'dull', 'oblivious'],
  difficulty_rating: 'hard',
  state:          'new',
}

// ─── Mastery ring ─────────────────────────────────────────────────────────────

function MasteryRing({ score }) {
  const r     = 32
  const circ  = 2 * Math.PI * r
  const color = score >= 80 ? 'var(--c-success)' : score >= 50 ? 'var(--c-warning)' : 'var(--c-primary)'

  return (
    <div style={{ position: 'relative', width: 80, height: 80 }}>
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="var(--c-border)" strokeWidth="5" />
        <motion.circle
          cx="40" cy="40" r={r}
          fill="none" stroke={color} strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - (score / 100) * circ }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
          transform="rotate(-90 40 40)"
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ fontSize: 18, fontWeight: 800, color, lineHeight: 1 }}>{score}</div>
        <div style={{ fontSize: 9, color: 'var(--c-text-muted)' }}>mastery</div>
      </div>
    </div>
  )
}

// ─── WordOfDay ────────────────────────────────────────────────────────────────

export function WordOfDay() {
  const navigate            = useNavigate()
  const { profile }         = useAuthStore()
  const { words, addWord }  = useUserStore()

  const [word,    setWord]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [added,   setAdded]   = useState(false)
  const [section, setSection] = useState('definition') // definition | memory | practice

  useEffect(() => { pickWordOfDay() }, [words])

  const pickWordOfDay = () => {
    setLoading(true)
    // Seed by today's date so same word shows all day
    const today = new Date().toISOString().split('T')[0]
    const seed  = today.split('-').reduce((a, b) => a + parseInt(b), 0)

    // Prioritize learning/struggling words
    const candidates = words.filter(w => w.state === 'learning' || w.state === 'struggling')
    const pool       = candidates.length >= 1 ? candidates : words

    if (pool.length === 0) {
      setWord(FALLBACK)
    } else {
      setWord(pool[seed % pool.length])
    }
    setLoading(false)
  }

  const handleAddToList = async () => {
    if (!profile?.id || added) return
    try {
      await addWord({
        user_id:    profile.id,
        word:       word.word,
        definition: word.definition,
        state:      'new',
        mastery_score: 0,
      })
      setAdded(true)
    } catch (err) {
      // Already in list
      setAdded(true)
    }
  }

  const alreadyInList = words.some(w => w.word.toLowerCase() === word?.word?.toLowerCase())

  const STATE_STYLES = {
    new:        { bg: 'var(--c-state-new-bg)',        color: 'var(--c-state-new)'        },
    learning:   { bg: 'var(--c-state-learning-bg)',   color: 'var(--c-state-learning)'   },
    struggling: { bg: 'var(--c-state-struggling-bg)', color: 'var(--c-state-struggling)' },
    mastered:   { bg: 'var(--c-state-mastered-bg)',   color: 'var(--c-state-mastered)'   },
  }

  const TABS = ['definition', 'memory', 'practice']

  if (loading || !word) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--c-bg-off)' }}>
        <div style={{ width: 32, height: 32, border: '3px solid var(--c-border)', borderTopColor: 'var(--c-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  const stateStyle = STATE_STYLES[word.state] || STATE_STYLES.new

  return (
    <div style={{ paddingTop: 20, paddingBottom: 32 }}>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 24 }}
      >
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'var(--c-primary-pale)',
          border: '1px solid rgba(139,26,46,0.15)',
          borderRadius: 99, padding: '5px 14px', marginBottom: 12,
        }}>
          <span style={{ fontSize: 14 }}>📅</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-primary)' }}>
            Word of the Day · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </motion.div>

      {/* Hero card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        style={{
          background: 'linear-gradient(135deg, #5c111e 0%, #8b1a2e 100%)',
          borderRadius: 20, padding: '28px 24px',
          marginBottom: 16, position: 'relative', overflow: 'hidden',
        }}
      >
        {/* Orb */}
        <div style={{
          position: 'absolute', top: -40, right: -40,
          width: 160, height: 160, borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)', pointerEvents: 'none',
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            {/* Badges */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                background: stateStyle.bg, color: stateStyle.color,
                textTransform: 'capitalize',
              }}>
                {word.state}
              </span>
              {word.difficulty_rating && (
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                  background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)',
                  textTransform: 'capitalize',
                }}>
                  {word.difficulty_rating}
                </span>
              )}
            </div>

            <div style={{
              fontSize: 36, fontWeight: 900, color: '#fff',
              letterSpacing: '-0.5px', lineHeight: 1.1, marginBottom: 6,
              fontFamily: 'Georgia, serif',
            }}>
              {word.word}
            </div>
            {word.pronunciation && (
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>
                {word.pronunciation}
              </div>
            )}
            {word.part_of_speech && (
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
                {word.part_of_speech}
              </div>
            )}
          </div>

          {/* Mastery ring */}
          <MasteryRing score={word.mastery_score || 0} />
        </div>

        {/* Add button */}
        {!alreadyInList && !added ? (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleAddToList}
            style={{
              marginTop: 20, width: '100%', minHeight: 44,
              background: 'rgba(255,255,255,0.15)',
              border: '1.5px solid rgba(255,255,255,0.3)',
              borderRadius: 'var(--r-sm)', color: '#fff',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
          >
            + Add to my list
          </motion.button>
        ) : (
          <div style={{
            marginTop: 20, padding: '10px',
            textAlign: 'center', fontSize: 13,
            color: 'rgba(255,255,255,0.6)',
          }}>
            ✓ Already in your list
          </div>
        )}
      </motion.div>

      {/* Tab bar */}
      <div style={{
        display: 'flex', background: 'var(--c-bg-subtle)',
        borderRadius: 'var(--r-sm)', padding: 4, marginBottom: 16,
      }}>
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setSection(tab)}
            style={{
              flex: 1, padding: '8px 0',
              fontSize: 13, fontWeight: 600, borderRadius: 6,
              border: 'none', cursor: 'pointer', transition: 'all 0.15s ease',
              background: section === tab ? 'var(--c-bg)' : 'transparent',
              color: section === tab ? 'var(--c-primary)' : 'var(--c-text-muted)',
              boxShadow: section === tab ? 'var(--shadow-sm)' : 'none',
              textTransform: 'capitalize',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">

        {/* Definition tab */}
        {section === 'definition' && (
          <motion.div
            key="definition"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            {/* Definition */}
            <div style={{ background: 'var(--c-bg)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-card)', padding: '18px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--c-text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Definition</div>
              <p style={{ fontSize: 16, color: 'var(--c-text)', lineHeight: 1.7, margin: 0 }}>{word.definition}</p>
            </div>

            {/* Examples */}
            {(word.example_sentence_1 || word.example_sentence_2) && (
              <div style={{ background: 'var(--c-bg)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-card)', padding: '18px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--c-text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>Examples</div>
                {word.example_sentence_1 && (
                  <p style={{ fontSize: 14, color: 'var(--c-text)', fontStyle: 'italic', lineHeight: 1.65, margin: '0 0 10px', borderLeft: '3px solid var(--c-primary)', paddingLeft: 12 }}>
                    "{word.example_sentence_1}"
                  </p>
                )}
                {word.example_sentence_2 && (
                  <p style={{ fontSize: 14, color: 'var(--c-text-muted)', fontStyle: 'italic', lineHeight: 1.65, margin: 0, borderLeft: '3px solid var(--c-border)', paddingLeft: 12 }}>
                    "{word.example_sentence_2}"
                  </p>
                )}
              </div>
            )}

            {/* Synonyms & Antonyms */}
            <div style={{ display: 'flex', gap: 10 }}>
              {word.synonyms?.length > 0 && (
                <div style={{ flex: 1, background: 'var(--c-bg)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-card)', padding: '14px' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--c-text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Synonyms</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {word.synonyms.slice(0, 4).map(s => (
                      <span key={s} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 99, background: 'var(--c-primary-pale)', color: 'var(--c-primary)', fontWeight: 500 }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {word.antonyms?.length > 0 && (
                <div style={{ flex: 1, background: 'var(--c-bg)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-card)', padding: '14px' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--c-text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Antonyms</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {word.antonyms.slice(0, 4).map(a => (
                      <span key={a} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 99, background: 'var(--c-danger-pale)', color: 'var(--c-danger)', fontWeight: 500 }}>{a}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Memory tab */}
        {section === 'memory' && (
          <motion.div
            key="memory"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            {/* Mnemonic */}
            {word.mnemonic_hint && (
              <div style={{ background: 'var(--c-gold-pale)', border: '1px solid var(--c-gold-light)', borderRadius: 'var(--r-card)', padding: '20px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--c-gold)', textTransform: 'uppercase', marginBottom: 10 }}>💡 Memory trick</div>
                <p style={{ fontSize: 16, color: 'var(--c-text)', lineHeight: 1.7, margin: 0 }}>{word.mnemonic_hint}</p>
              </div>
            )}

            {/* Etymology */}
            {word.etymology && (
              <div style={{ background: 'var(--c-bg)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-card)', padding: '18px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--c-text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>📜 Etymology</div>
                <p style={{ fontSize: 14, color: 'var(--c-text)', lineHeight: 1.65, margin: 0 }}>{word.etymology}</p>
              </div>
            )}

            {/* Confusable */}
            {word.confusable_word && (
              <div style={{ background: 'var(--c-bg)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-card)', padding: '18px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--c-text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>⚠️ Don't confuse with</div>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--c-text)' }}>{word.confusable_word}</span>
                {word.confusable_explanation && (
                  <p style={{ fontSize: 13, color: 'var(--c-text-muted)', lineHeight: 1.5, margin: '6px 0 0' }}>{word.confusable_explanation}</p>
                )}
              </div>
            )}

            {!word.mnemonic_hint && !word.etymology && !word.confusable_word && (
              <div style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--c-text-muted)', fontSize: 14 }}>
                No memory aids yet — add this word to your list to generate them.
              </div>
            )}
          </motion.div>
        )}

        {/* Practice tab */}
        {section === 'practice' && (
          <motion.div
            key="practice"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { emoji: '⚡', label: 'Start a session', desc: 'Practice with your full word list', onClick: () => navigate('/learn') },
                { emoji: '👹', label: 'Boss Battle', desc: 'Test yourself with 10 timed questions', onClick: () => navigate('/compete?tab=boss') },
                { emoji: '📖', label: 'Story Mode', desc: 'Read a story using your words', onClick: () => navigate('/learn?tab=story') },
              ].map(({ emoji, label, desc, onClick }) => (
                <motion.button
                  key={label}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClick}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '16px', background: 'var(--c-bg)',
                    border: '1px solid var(--c-border)',
                    borderRadius: 'var(--r-card)', cursor: 'pointer',
                    textAlign: 'left', transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{
                    fontSize: 24, width: 44, height: 44, borderRadius: 12,
                    background: 'var(--c-primary-pale)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {emoji}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--c-text)' }}>{label}</div>
                    <div style={{ fontSize: 12, color: 'var(--c-text-muted)', marginTop: 2 }}>{desc}</div>
                  </div>
                  <span style={{ color: 'var(--c-text-muted)', fontSize: 18 }}>›</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}