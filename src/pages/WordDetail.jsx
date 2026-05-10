import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { useUserStore } from '../stores/userStore'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATE_STYLES = {
  new:        { bg: 'var(--c-state-new-bg)',        color: 'var(--c-state-new)'        },
  learning:   { bg: 'var(--c-state-learning-bg)',   color: 'var(--c-state-learning)'   },
  struggling: { bg: 'var(--c-state-struggling-bg)', color: 'var(--c-state-struggling)' },
  mastered:   { bg: 'var(--c-state-mastered-bg)',   color: 'var(--c-state-mastered)'   },
}

const DIFFICULTY_STYLES = {
  easy:   { bg: 'var(--c-success-pale)', color: 'var(--c-success)' },
  medium: { bg: 'var(--c-warning-pale)', color: 'var(--c-warning)' },
  hard:   { bg: 'var(--c-danger-pale)',  color: 'var(--c-danger)'  },
}

// ─── Regenerate button ────────────────────────────────────────────────────────

function RegenButton({ onClick, loading }) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      disabled={loading}
      title="Regenerate with AI"
      style={{
        background: 'none', border: 'none',
        color: loading ? 'var(--c-border)' : 'var(--c-text-muted)',
        cursor: loading ? 'wait' : 'pointer',
        fontSize: 14, padding: '2px 4px',
        display: 'flex', alignItems: 'center',
        transition: 'color 0.15s',
      }}
    >
      <motion.span
        animate={loading ? { rotate: 360 } : { rotate: 0 }}
        transition={loading ? { repeat: Infinity, duration: 0.8, ease: 'linear' } : {}}
        style={{ display: 'inline-block' }}
      >
        🔄
      </motion.span>
    </motion.button>
  )
}

// ─── Field block ──────────────────────────────────────────────────────────────

function Field({ label, children, onRegen, regenLoading, accent }) {
  return (
    <div style={{
      background: accent ? accent.bg : 'var(--c-bg-subtle)',
      borderRadius: 'var(--r-sm)',
      padding: '12px 14px',
      border: accent ? `1px solid ${accent.border}` : '1px solid var(--c-border)',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 6,
      }}>
        <div style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
          color: accent ? accent.labelColor : 'var(--c-text-muted)',
          textTransform: 'uppercase',
        }}>
          {label}
        </div>
        {onRegen && (
          <RegenButton onClick={onRegen} loading={regenLoading} />
        )}
      </div>
      {children}
    </div>
  )
}

// ─── Mastery bar ──────────────────────────────────────────────────────────────

function MasteryBar({ score }) {
  const color =
    score >= 80 ? 'var(--c-success)' :
    score >= 50 ? 'var(--c-warning)' :
    score >= 20 ? 'var(--c-primary)' :
    'var(--c-danger)'

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>Mastery score</span>
        <span style={{ fontSize: 13, fontWeight: 700, color }}>
          {score} / 100
        </span>
      </div>
      <div style={{ height: 8, background: 'var(--c-border)', borderRadius: 4, overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ height: '100%', borderRadius: 4, background: color }}
        />
      </div>
    </div>
  )
}

// ─── Chip list ────────────────────────────────────────────────────────────────

function Chips({ items, color, bg }) {
  if (!items?.length) return <span style={{ fontSize: 13, color: 'var(--c-text-muted)' }}>—</span>
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {items.map(item => (
        <span key={item} style={{
          fontSize: 12, fontWeight: 500,
          padding: '3px 10px', borderRadius: 99,
          background: bg, color,
        }}>
          {item}
        </span>
      ))}
    </div>
  )
}

// ─── Mastery celebration overlay ──────────────────────────────────────────────

function MasteryCelebration({ word, onDone }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 260 }}
        style={{
          background: 'var(--c-bg)',
          borderRadius: 24, padding: '36px 28px',
          textAlign: 'center', maxWidth: 320, width: '100%',
          boxShadow: 'var(--shadow-lg)',
          border: '2px solid var(--c-success)',
        }}
      >
        {/* Sparkles */}
        {['✨','⭐','💫','🌟','✨'].map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0, x: (i - 2) * 30, y: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1.4, 0], y: -60 }}
            transition={{ delay: i * 0.1, duration: 0.8 }}
            style={{ position: 'absolute', fontSize: 20 }}
          >
            {s}
          </motion.div>
        ))}

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.1 }}
          style={{ fontSize: 56, marginBottom: 12 }}
        >
          🏆
        </motion.div>

        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--c-success)', marginBottom: 6 }}>
          Word Mastered!
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--c-text)', marginBottom: 6 }}>
          {word}
        </div>
        <div style={{ fontSize: 13, color: 'var(--c-text-muted)', marginBottom: 24, lineHeight: 1.5 }}>
          Mastery score hit 80+. This word will be reviewed every 7 days to keep it fresh.
        </div>

        <button
          onClick={onDone}
          style={{
            width: '100%', minHeight: 48,
            background: 'var(--c-success)', color: '#fff',
            border: 'none', borderRadius: 'var(--r-sm)',
            fontSize: 15, fontWeight: 700, cursor: 'pointer',
          }}
        >
          Continue ✓
        </button>
      </motion.div>
    </motion.div>
  )
}

// ─── WordDetail page ──────────────────────────────────────────────────────────

export function WordDetail() {
  const navigate           = useNavigate()
  const { state }          = useLocation()
  const { profile }        = useAuthStore()
  const { updateWord }     = useUserStore()

  // Word passed via router state: navigate('/word', { state: { word } })
  const [word, setWord]    = useState(state?.word || null)
  const [regenField, setRegenField] = useState(null) // which field is regenerating
  const [showCelebration, setShowCelebration] = useState(false)
  const [editingDef, setEditingDef] = useState(false)
  const [defDraft, setDefDraft]     = useState(word?.definition || '')

  if (!word) {
    return (
      <div style={{ padding: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>😕</div>
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--c-text)', marginBottom: 16 }}>
          Word not found
        </div>
        <button
          onClick={() => navigate('/learn?tab=bank')}
          style={{
            background: 'var(--c-primary)', color: '#fff',
            border: 'none', borderRadius: 'var(--r-sm)',
            padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}
        >
          Back to Vocab Bank
        </button>
      </div>
    )
  }

  const stateStyle  = STATE_STYLES[word.state] || STATE_STYLES.new
  const diffStyle   = DIFFICULTY_STYLES[word.difficulty_rating] || DIFFICULTY_STYLES.medium
  const correctRate = word.times_seen > 0
    ? Math.round((word.times_correct / word.times_seen) * 100)
    : null

  // ── Update helper ──────────────────────────────────────────────────
  const patch = async (updates) => {
    const updated = await updateWord(word.id, updates)
    setWord(updated)

    // Check if just hit mastered
    if (updates.mastery_score >= 80 && word.state !== 'mastered') {
      setShowCelebration(true)
    }
  }

  // ── AI regenerate ──────────────────────────────────────────────────
  const regenerate = async (fieldType) => {
    setRegenField(fieldType)
    try {
      const { data: { session } } = await supabase.auth.getSession()

      const prompts = {
        mnemonic: `Give a single creative mnemonic trick to remember the word "${word.word}" (definition: "${word.definition}"). Return ONLY a JSON object: {"mnemonic_hint": "..."}`,
        example:  `Write two different natural example sentences for the SAT word "${word.word}" (definition: "${word.definition}"). Return ONLY a JSON object: {"example_sentence_1": "...", "example_sentence_2": "..."}`,
        fill:     `Write a fill-in-the-blank sentence for "${word.word}" (definition: "${word.definition}"). Use [BLANK] as the placeholder. Return ONLY JSON: {"fill_in_blank_sentence": "..."}`,
      }

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/enrich-word`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ word: word.word, definition: word.definition, regen: fieldType }),
      })

      if (!res.ok) throw new Error('Regenerate failed')
      const json = await res.json()
      const data = json.word || json

      const fieldMap = {
        mnemonic: { mnemonic_hint: data.mnemonic_hint },
        example:  { example_sentence_1: data.example_sentence_1, example_sentence_2: data.example_sentence_2 },
        fill:     { fill_in_blank_sentence: data.fill_in_blank_sentence },
      }

      if (fieldMap[fieldType]) await patch(fieldMap[fieldType])
    } catch (err) {
      console.error('Regen error:', err)
    } finally {
      setRegenField(null)
    }
  }

  // ── Save definition edit ───────────────────────────────────────────
  const saveDefinition = async () => {
    if (defDraft.trim() && defDraft !== word.definition) {
      await patch({ definition: defDraft.trim() })
    }
    setEditingDef(false)
  }

  // ── Difficulty change ──────────────────────────────────────────────
  const cycleDifficulty = async () => {
    const order = ['easy', 'medium', 'hard']
    const next = order[(order.indexOf(word.difficulty_rating || 'medium') + 1) % 3]
    await patch({ difficulty_rating: next })
  }

  return (
    <div style={{ paddingTop: 16, paddingBottom: 24 }}>

      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        style={{
          background: 'none', border: 'none',
          color: 'var(--c-text-muted)', fontSize: 14,
          cursor: 'pointer', padding: 0, marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 4,
        }}
      >
        ← Back
      </button>

      {/* Word hero card */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'var(--c-bg)',
          border: '1px solid var(--c-border)',
          borderRadius: 'var(--r-card)',
          padding: '24px 20px',
          marginBottom: 16,
          position: 'relative', overflow: 'hidden',
        }}
      >
        {/* Background accent */}
        <div style={{
          position: 'absolute', top: -30, right: -30,
          width: 130, height: 130, borderRadius: '50%',
          background: 'var(--c-primary-pale)', pointerEvents: 'none',
        }} />

        {/* Badges row */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '3px 10px',
            borderRadius: 99, textTransform: 'capitalize',
            background: stateStyle.bg, color: stateStyle.color,
          }}>
            {word.state}
          </span>
          <motion.span
            whileTap={{ scale: 0.92 }}
            onClick={cycleDifficulty}
            style={{
              fontSize: 11, fontWeight: 600, padding: '3px 10px',
              borderRadius: 99, textTransform: 'capitalize', cursor: 'pointer',
              background: diffStyle.bg, color: diffStyle.color,
            }}
            title="Tap to change difficulty"
          >
            {word.difficulty_rating || 'medium'}
          </motion.span>
          {word.part_of_speech && (
            <span style={{
              fontSize: 11, fontWeight: 500, padding: '3px 10px',
              borderRadius: 99,
              background: 'var(--c-bg-subtle)', color: 'var(--c-text-muted)',
              border: '1px solid var(--c-border)',
            }}>
              {word.part_of_speech}
            </span>
          )}
        </div>

        {/* Word + pronunciation */}
        <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--c-text)', letterSpacing: '-0.5px', marginBottom: 4 }}>
          {word.word}
        </div>
        {word.pronunciation && (
          <div style={{ fontSize: 15, color: 'var(--c-text-muted)', marginBottom: 16 }}>
            {word.pronunciation}
          </div>
        )}

        {/* Definition — editable */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--c-text-muted)', textTransform: 'uppercase' }}>
              Definition
            </span>
            <button
              onClick={() => { setEditingDef(e => !e); setDefDraft(word.definition) }}
              style={{
                background: 'none', border: 'none',
                color: 'var(--c-primary)', fontSize: 12, fontWeight: 600,
                cursor: 'pointer', padding: 0,
              }}
            >
              {editingDef ? 'Cancel' : '✏️ Edit'}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {editingDef ? (
              <motion.div
                key="editing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <textarea
                  autoFocus
                  value={defDraft}
                  onChange={e => setDefDraft(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 12px',
                    background: 'var(--c-bg-subtle)',
                    border: '1.5px solid var(--c-primary)',
                    borderRadius: 'var(--r-sm)',
                    fontSize: 15, color: 'var(--c-text)',
                    lineHeight: 1.6, resize: 'vertical',
                    minHeight: 80, outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  onClick={saveDefinition}
                  style={{
                    marginTop: 8, padding: '8px 18px',
                    background: 'var(--c-primary)', color: '#fff',
                    border: 'none', borderRadius: 'var(--r-sm)',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  Save
                </button>
              </motion.div>
            ) : (
              <motion.p
                key="display"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ fontSize: 16, color: 'var(--c-text)', lineHeight: 1.65, margin: 0 }}
              >
                {word.definition}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Mastery bar */}
        <MasteryBar score={word.mastery_score || 0} />
      </motion.div>

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        style={{ display: 'flex', gap: 10, marginBottom: 16 }}
      >
        {[
          { label: 'Times seen',    value: word.times_seen || 0     },
          { label: 'Correct',       value: word.times_correct || 0  },
          { label: 'Accuracy',      value: correctRate !== null ? `${correctRate}%` : '—' },
        ].map(({ label, value }) => (
          <div key={label} style={{
            flex: 1, textAlign: 'center',
            background: 'var(--c-bg)',
            border: '1px solid var(--c-border)',
            borderRadius: 'var(--r-sm)', padding: '12px 4px',
          }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--c-primary)' }}>{value}</div>
            <div style={{ fontSize: 10, color: 'var(--c-text-muted)', marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </motion.div>

      {/* Examples */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        style={{ marginBottom: 12 }}
      >
        <Field
          label="Examples"
          onRegen={() => regenerate('example')}
          regenLoading={regenField === 'example'}
        >
          {word.example_sentence_1 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ fontSize: 14, color: 'var(--c-text)', fontStyle: 'italic', lineHeight: 1.6, margin: 0 }}>
                "{word.example_sentence_1}"
              </p>
              {word.example_sentence_2 && (
                <p style={{ fontSize: 14, color: 'var(--c-text-muted)', fontStyle: 'italic', lineHeight: 1.6, margin: 0 }}>
                  "{word.example_sentence_2}"
                </p>
              )}
            </div>
          ) : (
            <span style={{ fontSize: 13, color: 'var(--c-text-muted)' }}>
              No examples yet — tap 🔄 to generate
            </span>
          )}
        </Field>
      </motion.div>

      {/* Mnemonic */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        style={{ marginBottom: 12 }}
      >
        <Field
          label="💡 Memory trick"
          onRegen={() => regenerate('mnemonic')}
          regenLoading={regenField === 'mnemonic'}
          accent={{
            bg: 'var(--c-gold-pale)',
            border: 'var(--c-gold-light)',
            labelColor: 'var(--c-gold)',
          }}
        >
          <p style={{ fontSize: 14, color: 'var(--c-text)', lineHeight: 1.6, margin: 0 }}>
            {word.mnemonic_hint || (
              <span style={{ color: 'var(--c-text-muted)' }}>
                No mnemonic yet — tap 🔄 to generate one
              </span>
            )}
          </p>
        </Field>
      </motion.div>

      {/* Fill in the blank */}
      {(word.fill_in_blank_sentence || true) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          style={{ marginBottom: 12 }}
        >
          <Field
            label="Fill in the blank"
            onRegen={() => regenerate('fill')}
            regenLoading={regenField === 'fill'}
          >
            <p style={{ fontSize: 14, color: 'var(--c-text)', lineHeight: 1.6, margin: 0 }}>
              {word.fill_in_blank_sentence
                ? word.fill_in_blank_sentence.replace('[BLANK]', (
                  `___`
                ))
                : <span style={{ color: 'var(--c-text-muted)' }}>Tap 🔄 to generate a fill-in-the-blank sentence</span>
              }
            </p>
          </Field>
        </motion.div>
      )}

      {/* Synonyms + Antonyms */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{ display: 'flex', gap: 10, marginBottom: 12 }}
      >
        <div style={{ flex: 1 }}>
          <Field label="Synonyms">
            <Chips
              items={word.synonyms}
              color="var(--c-primary)"
              bg="var(--c-primary-pale)"
            />
          </Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="Antonyms">
            <Chips
              items={word.antonyms}
              color="var(--c-danger)"
              bg="var(--c-danger-pale)"
            />
          </Field>
        </div>
      </motion.div>

      {/* Confusable */}
      {word.confusable_word && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          style={{ marginBottom: 12 }}
        >
          <Field label="⚠️ Don't confuse with">
            <div>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--c-text)' }}>
                {word.confusable_word}
              </span>
              {word.confusable_explanation && (
                <span style={{ fontSize: 13, color: 'var(--c-text-muted)' }}>
                  {' '}— {word.confusable_explanation}
                </span>
              )}
            </div>
          </Field>
        </motion.div>
      )}

      {/* Etymology */}
      {(word.etymology || word.origin_story) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
          style={{ marginBottom: 12 }}
        >
          <Field label="📜 Etymology">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {word.etymology && (
                <p style={{ fontSize: 14, color: 'var(--c-text)', lineHeight: 1.6, margin: 0 }}>
                  {word.etymology}
                </p>
              )}
              {word.origin_story && (
                <p style={{ fontSize: 13, color: 'var(--c-text-muted)', lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>
                  {word.origin_story}
                </p>
              )}
            </div>
          </Field>
        </motion.div>
      )}

      {/* Last reviewed */}
      {word.last_reviewed_at && (
        <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--c-text-muted)', marginTop: 8 }}>
          Last reviewed {new Date(word.last_reviewed_at).toLocaleDateString()}
          {word.next_review_at && ` · Next review ${new Date(word.next_review_at).toLocaleDateString()}`}
        </div>
      )}

      {/* Mastery celebration */}
      <AnimatePresence>
        {showCelebration && (
          <MasteryCelebration
            word={word.word}
            onDone={() => setShowCelebration(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}