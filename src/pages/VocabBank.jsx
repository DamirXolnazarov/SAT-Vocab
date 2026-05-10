import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../stores/authStore'
import { useUserStore } from '../stores/userStore'
import { useNavigate } from 'react-router-dom'

// ─── State pill ───────────────────────────────────────────────────────────────

const STATE_STYLES = {
  new:        { bg: 'var(--c-state-new-bg)',        color: 'var(--c-state-new)'        },
  learning:   { bg: 'var(--c-state-learning-bg)',   color: 'var(--c-state-learning)'   },
  struggling: { bg: 'var(--c-state-struggling-bg)', color: 'var(--c-state-struggling)' },
  mastered:   { bg: 'var(--c-state-mastered-bg)',   color: 'var(--c-state-mastered)'   },
}

function StatePill({ state }) {
  const s = STATE_STYLES[state] || STATE_STYLES.new
  return (
    <span style={{
      display: 'inline-block',
      fontSize: 10, fontWeight: 600, padding: '2px 8px',
      borderRadius: 99,
      background: s.bg, color: s.color,
      textTransform: 'capitalize',
    }}>
      {state}
    </span>
  )
}

// ─── Word card ────────────────────────────────────────────────────────────────

function WordCard({ word, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { deleteWord } = useUserStore()

  const handleDelete = async (e) => {
    e.stopPropagation()
    if (!confirm(`Delete "${word.word}"?`)) return
    setDeleting(true)
    try { await deleteWord(word.id) } catch { setDeleting(false) }
  }

  const correctRate = word.times_seen > 0
    ? Math.round((word.times_correct / word.times_seen) * 100)
    : null

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      style={{
        background: 'var(--c-bg)',
        border: '1px solid var(--c-border)',
        borderRadius: 'var(--r-card)',
        overflow: 'hidden',
        opacity: deleting ? 0.5 : 1,
        transition: 'opacity 0.2s',
      }}
    >
      {/* Header row — always visible */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 16px', cursor: 'pointer',
        }}
      >
        {/* Mastery dot */}
        <div style={{
          width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
          background: STATE_STYLES[word.state]?.color || 'var(--c-border)',
        }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--c-text)' }}>
              {word.word}
            </span>
            {word.part_of_speech && (
              <span style={{ fontSize: 11, color: 'var(--c-text-muted)' }}>
                {word.part_of_speech}
              </span>
            )}
          </div>
          <div style={{
            fontSize: 13, color: 'var(--c-text-muted)',
            marginTop: 2,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {word.definition}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <StatePill state={word.state} />
          <span style={{
            fontSize: 16, color: 'var(--c-text-muted)',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            display: 'inline-block',
          }}>
            ›
          </span>
        </div>
      </div>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              padding: '0 16px 16px',
              borderTop: '1px solid var(--c-border)',
              paddingTop: 14,
            }}>
              {/* Mastery bar */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: 'var(--c-text-muted)' }}>Mastery</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-text)' }}>
                    {word.mastery_score || 0}/100
                  </span>
                </div>
                <div style={{ height: 6, background: 'var(--c-border)', borderRadius: 3, overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${word.mastery_score || 0}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    style={{
                      height: '100%', borderRadius: 3,
                      background: (word.mastery_score || 0) >= 80
                        ? 'var(--c-success)'
                        : 'var(--c-primary)',
                    }}
                  />
                </div>
              </div>

              {/* Stats row */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                {[
                  { label: 'Seen', value: word.times_seen || 0 },
                  { label: 'Correct', value: word.times_correct || 0 },
                  { label: 'Accuracy', value: correctRate !== null ? `${correctRate}%` : '—' },
                ].map(({ label, value }) => (
                  <div key={label} style={{
                    flex: 1, textAlign: 'center',
                    background: 'var(--c-bg-subtle)',
                    borderRadius: 'var(--r-sm)', padding: '8px 4px',
                  }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--c-text)' }}>{value}</div>
                    <div style={{ fontSize: 10, color: 'var(--c-text-muted)' }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Definition */}
              <div style={{ fontSize: 14, color: 'var(--c-text)', lineHeight: 1.6, marginBottom: 12 }}>
                {word.definition}
              </div>

              {/* Example sentences */}
              {(word.example_sentence_1 || word.example_sentence_2) && (
                <div style={{
                  background: 'var(--c-bg-subtle)', borderRadius: 'var(--r-sm)',
                  padding: '10px 12px', marginBottom: 12,
                }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--c-text-muted)', marginBottom: 4 }}>
                    EXAMPLE
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--c-text)', fontStyle: 'italic', lineHeight: 1.5 }}>
                    "{word.example_sentence_1 || word.example_sentence_2}"
                  </div>
                </div>
              )}

              {/* Mnemonic */}
              {word.mnemonic_hint && (
                <div style={{
                  background: 'var(--c-gold-pale)', borderRadius: 'var(--r-sm)',
                  padding: '10px 12px', marginBottom: 12,
                  border: '1px solid var(--c-gold-light)',
                }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--c-gold)', marginBottom: 4 }}>
                    💡 MNEMONIC
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--c-text)', lineHeight: 1.5 }}>
                    {word.mnemonic_hint}
                  </div>
                </div>
              )}

              {/* Delete */}
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  background: 'none', border: 'none',
                  color: 'var(--c-danger)', fontSize: 13,
                  cursor: 'pointer', padding: 0, opacity: deleting ? 0.5 : 1,
                }}
              >
                🗑 Remove word
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Add word modal ───────────────────────────────────────────────────────────

function AddWordModal({ onClose, onAdd }) {
  const [word, setWord]       = useState('')
  const [def, setDef]         = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const handleAdd = async () => {
    if (!word.trim()) { setError('Word is required'); return }
    if (!def.trim())  { setError('Definition is required'); return }
    setLoading(true)
    try {
      await onAdd({ word: word.trim(), definition: def.trim() })
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to add word')
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '12px 14px', minHeight: 48,
    background: 'var(--c-bg)', border: '1.5px solid var(--c-border)',
    borderRadius: 'var(--r-sm)', color: 'var(--c-text)',
    fontSize: 16, outline: 'none',
  }

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
        padding: '0 0 env(safe-area-inset-bottom)',
      }}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 560,
          background: 'var(--c-bg)',
          borderRadius: '20px 20px 0 0',
          padding: '24px 24px 32px',
        }}
      >
        {/* Handle */}
        <div style={{
          width: 40, height: 4, borderRadius: 2,
          background: 'var(--c-border)', margin: '0 auto 20px',
        }} />

        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--c-text)', marginBottom: 20 }}>
          Add new word
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--c-text)', marginBottom: 6 }}>
              Word *
            </label>
            <input
              style={inputStyle}
              placeholder="e.g. Ephemeral"
              value={word}
              onChange={e => setWord(e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--c-text)', marginBottom: 6 }}>
              Definition *
            </label>
            <textarea
              style={{ ...inputStyle, minHeight: 90, resize: 'vertical', lineHeight: 1.5 }}
              placeholder="e.g. Lasting for only a short time; transitory."
              value={def}
              onChange={e => setDef(e.target.value)}
            />
          </div>

          {error && (
            <div style={{
              padding: '10px 14px', fontSize: 13,
              background: 'var(--c-danger-pale)', color: 'var(--c-danger)',
              borderRadius: 'var(--r-sm)',
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={onClose}
              style={{
                flex: 1, minHeight: 48,
                background: 'transparent',
                border: '1px solid var(--c-border)',
                borderRadius: 'var(--r-sm)',
                color: 'var(--c-text-muted)', fontSize: 15, fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={loading}
              style={{
                flex: 2, minHeight: 48,
                background: 'var(--c-primary)', color: '#fff',
                border: 'none', borderRadius: 'var(--r-sm)',
                fontSize: 15, fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {loading
                ? <span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                : 'Add word'
              }
            </button>
          </div>
        </div>
      </motion.div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </motion.div>
  )
}

// ─── VocabBank ────────────────────────────────────────────────────────────────

const FILTER_OPTIONS = [
  { value: 'all',        label: 'All'        },
  { value: 'new',        label: 'New'        },
  { value: 'learning',   label: 'Learning'   },
  { value: 'struggling', label: 'Struggling' },
  { value: 'mastered',   label: 'Mastered'   },
]

export function VocabBank() {
  const { profile } = useAuthStore()
  const { words, wordsLoading, addWord } = useUserStore()
const navigate = useNavigate()
 
  const [search,    setSearch]    = useState('')
  const [filter,    setFilter]    = useState('all')
  const [showModal, setShowModal] = useState(false)

  const handleAdd = async ({ word, definition }) => {
    await addWord({
      user_id:    profile.id,
      word,
      definition,
      state:         'new',
      mastery_score: 0,
    })
  }

  const filtered = words.filter(w => {
    const matchesFilter = filter === 'all' || w.state === filter
    const matchesSearch = !search ||
      w.word.toLowerCase().includes(search.toLowerCase()) ||
      w.definition.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  return (
    <div>
      {/* Search + Add */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <span style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            fontSize: 16, pointerEvents: 'none',
          }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search words..."
            style={{
              width: '100%', padding: '10px 14px 10px 36px',
              minHeight: 44, fontSize: 15,
              background: 'var(--c-bg)',
              border: '1px solid var(--c-border)',
              borderRadius: 'var(--r-sm)',
              color: 'var(--c-text)', outline: 'none',
            }}
          />
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            minHeight: 44, padding: '0 16px',
            background: 'var(--c-primary)', color: '#fff',
            border: 'none', borderRadius: 'var(--r-sm)',
            fontSize: 22, cursor: 'pointer', fontWeight: 300,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          +
        </button>
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 16 }}>
        {FILTER_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            style={{
              flexShrink: 0, padding: '5px 14px',
              borderRadius: 99, fontSize: 13, fontWeight: 500,
              cursor: 'pointer', border: 'none',
              transition: 'all 0.15s ease',
              background: filter === value ? 'var(--c-primary)' : 'var(--c-bg)',
              color: filter === value ? '#fff' : 'var(--c-text-muted)',
              boxShadow: filter === value ? 'var(--shadow-sm)' : 'none',
              outline: filter === value ? 'none' : '1px solid var(--c-border)',
            }}
          >
            {label}
            {value !== 'all' && (
              <span style={{ marginLeft: 6, opacity: 0.7 }}>
                {words.filter(w => w.state === value).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Word list */}
      {wordsLoading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--c-text-muted)' }}>
          Loading words…
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ textAlign: 'center', padding: '40px 20px' }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}>
            {words.length === 0 ? '📭' : '🔍'}
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--c-text)', marginBottom: 6 }}>
            {words.length === 0 ? 'No words yet' : 'No results'}
          </div>
          <div style={{ fontSize: 14, color: 'var(--c-text-muted)', marginBottom: 20 }}>
            {words.length === 0
              ? 'Add your first SAT word to get started'
              : 'Try a different search or filter'}
          </div>
          {words.length === 0 && (
            <button
              onClick={() => setShowModal(true)}
              style={{
                background: 'var(--c-primary)', color: '#fff',
                border: 'none', borderRadius: 'var(--r-sm)',
                padding: '10px 24px', fontSize: 14, fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              + Add first word
            </button>
          )}
        </motion.div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 12, color: 'var(--c-text-muted)', marginBottom: 4 }}>
            {filtered.length} word{filtered.length !== 1 ? 's' : ''}
            {filter !== 'all' ? ` · ${filter}` : ''}
          </div>
          <AnimatePresence>
            {filtered.map(word => (
              <WordCard key={word.id} word={word} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add word modal */}
      <AnimatePresence>
        {showModal && (
          <AddWordModal
            onClose={() => setShowModal(false)}
            onAdd={handleAdd}
          />
        )}
      </AnimatePresence>
    </div>
  )
}