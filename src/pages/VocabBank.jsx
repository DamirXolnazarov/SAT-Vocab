import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Plus, ChevronDown, ChevronUp, Trash2,
  BookOpen, Sparkles, X, CheckCircle, AlertCircle,
  BarChart2, Eye, Zap
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { useUserStore } from '../stores/userStore'

// ─── State pill ───────────────────────────────────────────────────────────────

const STATE_STYLES = {
  new:        { bg: '#e8f0fe', color: '#3b5bdb', label: 'New'        },
  learning:   { bg: '#fdf6e7', color: '#b07800', label: 'Learning'   },
  struggling: { bg: '#fae8e4', color: '#c04e26', label: 'Struggling' },
  mastered:   { bg: '#e1f5ee', color: '#0f6e56', label: 'Mastered'   },
}

function StatePill({ state }) {
  const s = STATE_STYLES[state] || STATE_STYLES.new
  return (
    <span style={{
      fontSize: 11, fontWeight: 600,
      padding: '2px 10px', borderRadius: 99,
      background: s.bg, color: s.color,
    }}>
      {s.label}
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
    if (!window.confirm(`Delete "${word.word}"?`)) return
    setDeleting(true)
    try {
      await deleteWord(word.id)
    } catch (err) {
      console.error('Delete failed:', err)
      setDeleting(false)
    }
  }

  const correctRate = word.times_seen > 0
    ? Math.round((word.times_correct / word.times_seen) * 100)
    : null

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0, opacity: deleting ? 0.4 : 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      style={{
        background: 'var(--c-bg)',
        border: '1px solid var(--c-border)',
        borderRadius: 'var(--r-card)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          display: 'flex', alignItems: 'center',
          gap: 12, padding: '14px 16px', cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        {/* State dot */}
        <div style={{
          width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
          background: STATE_STYLES[word.state]?.color || 'var(--c-border)',
        }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--c-text)' }}>
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
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {word.definition}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <StatePill state={word.state} />
          {expanded
            ? <ChevronUp size={16} color="var(--c-text-muted)" />
            : <ChevronDown size={16} color="var(--c-text-muted)" />
          }
        </div>
      </div>

      {/* Expanded */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
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
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--c-text)' }}>
                    {word.mastery_score || 0}/100
                  </span>
                </div>
                <div style={{ height: 5, background: 'var(--c-border)', borderRadius: 3, overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${word.mastery_score || 0}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    style={{
                      height: '100%', borderRadius: 3,
                      background: (word.mastery_score || 0) >= 80
                        ? 'var(--c-success)' : 'var(--c-primary)',
                    }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                {[
                  { icon: <Eye size={12} />, label: 'Seen',    value: word.times_seen || 0    },
                  { icon: <CheckCircle size={12} />, label: 'Correct', value: word.times_correct || 0 },
                  { icon: <BarChart2 size={12} />, label: 'Accuracy', value: correctRate !== null ? `${correctRate}%` : '—' },
                ].map(({ icon, label, value }) => (
                  <div key={label} style={{
                    flex: 1, textAlign: 'center',
                    background: 'var(--c-bg-subtle)',
                    borderRadius: 'var(--r-sm)', padding: '8px 4px',
                  }}>
                    <div style={{ color: 'var(--c-text-muted)', marginBottom: 2, display: 'flex', justifyContent: 'center' }}>
                      {icon}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--c-text)' }}>{value}</div>
                    <div style={{ fontSize: 10, color: 'var(--c-text-muted)' }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Definition */}
              <p style={{ fontSize: 14, color: 'var(--c-text)', lineHeight: 1.6, marginBottom: 12 }}>
                {word.definition}
              </p>

              {/* Example */}
              {word.example_sentence_1 && (
                <div style={{
                  background: 'var(--c-bg-subtle)',
                  borderRadius: 'var(--r-sm)',
                  padding: '10px 12px',
                  borderLeft: '3px solid var(--c-primary)',
                  marginBottom: 12,
                }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--c-text-muted)', marginBottom: 3 }}>
                    EXAMPLE
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--c-text)', fontStyle: 'italic', lineHeight: 1.5 }}>
                    "{word.example_sentence_1}"
                  </div>
                </div>
              )}

              {/* Mnemonic */}
              {word.mnemonic_hint && (
                <div style={{
                  background: 'var(--c-gold-pale)',
                  border: '1px solid var(--c-gold-light)',
                  borderRadius: 'var(--r-sm)',
                  padding: '10px 12px',
                  marginBottom: 12,
                }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--c-gold)', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Sparkles size={10} /> MEMORY TRICK
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
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'none', border: 'none',
                  color: 'var(--c-danger)', fontSize: 13,
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  padding: 0, opacity: deleting ? 0.5 : 1,
                }}
              >
                <Trash2 size={13} />
                Remove word
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
  const [query,    setQuery]    = useState('')
  const [results,  setResults]  = useState([])
  const [searching, setSearching] = useState(false)
  const [aiLoading, setAILoading] = useState(false)
  const [manualMode, setManualMode] = useState(false)
  const [manualDef, setManualDef] = useState('')
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState('')
  const debounceRef = useRef(null)
  const inputRef    = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Search word_bank as user types
  const handleSearch = (val) => {
    setQuery(val)
    setError('')
    setSuccess('')
    setManualMode(false)
    setResults([])
    clearTimeout(debounceRef.current)
    if (!val.trim() || val.length < 2) return

    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const { data, error: dbErr } = await supabase
          .from('word_bank')
          .select('*')
          .ilike('word', `%${val.trim()}%`)
          .order('word')
          .limit(6)

        if (dbErr) throw dbErr
        setResults(data || [])
      } catch (err) {
        setError('Search failed. Check your connection.')
      } finally {
        setSearching(false)
      }
    }, 300)
  }

  // Add from word_bank result
  const handleAddFromBank = async (bankWord) => {
    try {
      await onAdd({
        word:                   bankWord.word,
        definition:             bankWord.definition,
        pronunciation:          bankWord.pronunciation || null,
        part_of_speech:         bankWord.part_of_speech || null,
        etymology:              bankWord.etymology || null,
        mnemonic_hint:          bankWord.mnemonic_hint || null,
        confusable_word:        bankWord.confusable_word || null,
        confusable_explanation: bankWord.confusable_explanation || null,
        synonyms:               bankWord.synonyms || [],
        antonyms:               bankWord.antonyms || [],
        example_sentence_1:     bankWord.example_sentence_1 || null,
        example_sentence_2:     bankWord.example_sentence_2 || null,
        difficulty_rating:      bankWord.difficulty_rating || 'medium',
        state:                  'new',
        mastery_score:          0,
      })
      setSuccess(`"${bankWord.word}" added to your list!`)
      setTimeout(onClose, 1200)
    } catch (err) {
      setError('Failed to add word. Try again.')
    }
  }

  // AI enrich unknown word
  const handleAIEnrich = async () => {
    if (!query.trim()) return
    setAILoading(true)
    setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/enrich-word`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ word: query.trim() }),
        }
      )
      if (!res.ok) throw new Error('AI enrichment failed')
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      await handleAddFromBank(json.word)
    } catch (err) {
      // AI failed — fall back to manual mode
      setManualMode(true)
      setError('')
    } finally {
      setAILoading(false)
    }
  }

  // Manual add (fallback if AI fails)
  const handleManualAdd = async () => {
    if (!query.trim() || !manualDef.trim()) {
      setError('Both word and definition are required.')
      return
    }
    try {
      await onAdd({
        word:          query.trim(),
        definition:    manualDef.trim(),
        state:         'new',
        mastery_score: 0,
      })
      setSuccess(`"${query.trim()}" added!`)
      setTimeout(onClose, 1200)
    } catch (err) {
      setError('Failed to add word. Try again.')
    }
  }

  const noResults = query.length >= 2 && !searching && results.length === 0

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 540,
          background: 'var(--c-bg)',
          borderRadius: '20px 20px 0 0',
          padding: '20px 20px 40px',
          maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        {/* Handle */}
        <div style={{
          width: 36, height: 4, borderRadius: 2,
          background: 'var(--c-border)',
          margin: '0 auto 20px',
        }} />

        {/* Title row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--c-text)' }}>
            Add a word
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-text-muted)', padding: 4 }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Search input */}
        <div style={{ position: 'relative', marginBottom: 14 }}>
          <Search
            size={16}
            color="var(--c-text-muted)"
            style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          />
          <input
            ref={inputRef}
            value={query}
            onChange={e => handleSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && noResults && !manualMode && handleAIEnrich()}
            placeholder="Search or type a word…"
            style={{
              width: '100%', padding: '12px 14px 12px 40px',
              minHeight: 48, fontSize: 16,
              background: 'var(--c-bg-subtle)',
              border: '1.5px solid var(--c-border)',
              borderRadius: 'var(--r-sm)',
              color: 'var(--c-text)', outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.15s ease',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--c-primary)'}
            onBlur={e => e.target.style.borderColor = 'var(--c-border)'}
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setResults([]); setManualMode(false); setError('') }}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-text-muted)', padding: 2 }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Feedback messages */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 14px', marginBottom: 12,
                background: 'var(--c-success-pale)',
                border: '1px solid var(--c-success)',
                borderRadius: 'var(--r-sm)',
                fontSize: 13, color: 'var(--c-success)', fontWeight: 500,
              }}
            >
              <CheckCircle size={15} />
              {success}
            </motion.div>
          )}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 14px', marginBottom: 12,
                background: 'var(--c-danger-pale)',
                border: '1px solid var(--c-danger)',
                borderRadius: 'var(--r-sm)',
                fontSize: 13, color: 'var(--c-danger)',
              }}
            >
              <AlertCircle size={15} />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Searching spinner */}
        {searching && (
          <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--c-text-muted)', fontSize: 13 }}>
            Searching…
          </div>
        )}

        {/* Word bank results */}
        <AnimatePresence>
          {results.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}
            >
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--c-text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 2 }}>
                From word bank
              </div>
              {results.map(w => (
                <div
                  key={w.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px',
                    background: 'var(--c-bg-subtle)',
                    border: '1px solid var(--c-border)',
                    borderRadius: 'var(--r-sm)',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--c-text)', marginBottom: 2 }}>
                      {w.word}
                    </div>
                    <div style={{
                      fontSize: 12, color: 'var(--c-text-muted)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {w.definition}
                    </div>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.94 }}
                    onClick={() => handleAddFromBank(w)}
                    style={{
                      flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5,
                      padding: '7px 14px',
                      background: 'var(--c-primary)', color: '#fff',
                      border: 'none', borderRadius: 99,
                      fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    <Plus size={13} />
                    Add
                  </motion.button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* No results — offer AI lookup */}
        <AnimatePresence>
          {noResults && !manualMode && !aiLoading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{ marginTop: 4 }}
            >
              <div style={{
                textAlign: 'center', padding: '20px 16px',
                background: 'var(--c-bg-subtle)',
                border: '1px dashed var(--c-border)',
                borderRadius: 'var(--r-card)',
                marginBottom: 12,
              }}>
                <BookOpen size={28} color="var(--c-text-muted)" style={{ margin: '0 auto 10px', display: 'block' }} />
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-text)', marginBottom: 4 }}>
                  "{query}" not in word bank
                </div>
                <div style={{ fontSize: 13, color: 'var(--c-text-muted)', marginBottom: 16 }}>
                  Let AI look it up and add full details automatically
                </div>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleAIEnrich}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '10px 24px',
                    background: 'var(--c-primary)', color: '#fff',
                    border: 'none', borderRadius: 99,
                    fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  <Sparkles size={15} />
                  Look up with AI
                </motion.button>
                <div style={{ marginTop: 10 }}>
                  <button
                    onClick={() => setManualMode(true)}
                    style={{
                      background: 'none', border: 'none',
                      color: 'var(--c-text-muted)', fontSize: 12,
                      cursor: 'pointer', textDecoration: 'underline',
                    }}
                  >
                    Or add manually
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI loading */}
        <AnimatePresence>
          {aiLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                textAlign: 'center', padding: '24px 16px',
                background: 'var(--c-primary-pale)',
                border: '1px solid rgba(139,26,46,0.15)',
                borderRadius: 'var(--r-card)',
              }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                style={{
                  width: 32, height: 32, margin: '0 auto 12px',
                  border: '3px solid var(--c-primary-pale)',
                  borderTopColor: 'var(--c-primary)',
                  borderRadius: '50%',
                }}
              />
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-primary)', marginBottom: 4 }}>
                Looking up "{query}"…
              </div>
              <div style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>
                Generating definition, examples, mnemonics
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Manual mode */}
        <AnimatePresence>
          {manualMode && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-text)', marginBottom: 10 }}>
                Add manually
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--c-text-muted)', marginBottom: 5 }}>
                  Word
                </label>
                <input
                  value={query}
                  readOnly
                  style={{
                    width: '100%', padding: '10px 14px', minHeight: 44,
                    background: 'var(--c-bg-subtle)',
                    border: '1px solid var(--c-border)',
                    borderRadius: 'var(--r-sm)', fontSize: 15,
                    color: 'var(--c-text)', outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--c-text-muted)', marginBottom: 5 }}>
                  Definition
                </label>
                <textarea
                  value={manualDef}
                  onChange={e => setManualDef(e.target.value)}
                  placeholder="Enter the definition…"
                  autoFocus
                  style={{
                    width: '100%', padding: '10px 14px', minHeight: 90,
                    background: 'var(--c-bg-subtle)',
                    border: '1.5px solid var(--c-border)',
                    borderRadius: 'var(--r-sm)', fontSize: 14,
                    color: 'var(--c-text)', outline: 'none',
                    resize: 'vertical', lineHeight: 1.5,
                    boxSizing: 'border-box',
                    transition: 'border-color 0.15s ease',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--c-primary)'}
                  onBlur={e => e.target.style.borderColor = 'var(--c-border)'}
                />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setManualMode(false)}
                  style={{
                    flex: 1, minHeight: 44,
                    background: 'transparent',
                    border: '1px solid var(--c-border)',
                    borderRadius: 'var(--r-sm)',
                    color: 'var(--c-text-muted)',
                    fontSize: 14, cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleManualAdd}
                  style={{
                    flex: 2, minHeight: 44,
                    background: 'var(--c-primary)', color: '#fff',
                    border: 'none', borderRadius: 'var(--r-sm)',
                    fontSize: 14, fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}
                >
                  <Plus size={15} />
                  Add word
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty / prompt state */}
        {!query && (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--c-text-muted)' }}>
            <Search size={32} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.3 }} />
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Search 1,380+ SAT words</div>
            <div style={{ fontSize: 12 }}>Or type any word — AI will look it up</div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

// ─── VocabBank ────────────────────────────────────────────────────────────────

const FILTERS = [
  { value: 'all',        label: 'All'        },
  { value: 'new',        label: 'New'        },
  { value: 'learning',   label: 'Learning'   },
  { value: 'struggling', label: 'Struggling' },
  { value: 'mastered',   label: 'Mastered'   },
]

export function VocabBank() {
  const { profile }                           = useAuthStore()
  const { words, wordsLoading, addWord, fetchWords } = useUserStore()

  const [search,    setSearch]    = useState('')
  const [filter,    setFilter]    = useState('all')
  const [showModal, setShowModal] = useState(false)

  // Fetch words on mount if not loaded
  useEffect(() => {
    if (profile?.id && words.length === 0 && !wordsLoading) {
      fetchWords(profile.id)
    }
  }, [profile?.id])

  const handleAdd = async (wordData) => {
    if (!profile?.id) throw new Error('Not logged in')
    await addWord({ ...wordData, user_id: profile.id })
  }

  const filtered = words.filter(w => {
    const matchFilter = filter === 'all' || w.state === filter
    const matchSearch = !search.trim() ||
      w.word.toLowerCase().includes(search.toLowerCase()) ||
      w.definition.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const counts = {
    new:        words.filter(w => w.state === 'new').length,
    learning:   words.filter(w => w.state === 'learning').length,
    struggling: words.filter(w => w.state === 'struggling').length,
    mastered:   words.filter(w => w.state === 'mastered').length,
  }

  return (
    <div>
      {/* Search + Add */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search
            size={15}
            color="var(--c-text-muted)"
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search your words…"
            style={{
              width: '100%', padding: '10px 14px 10px 36px',
              minHeight: 44, fontSize: 14,
              background: 'var(--c-bg)',
              border: '1px solid var(--c-border)',
              borderRadius: 'var(--r-sm)',
              color: 'var(--c-text)', outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.15s ease',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--c-primary)'}
            onBlur={e => e.target.style.borderColor = 'var(--c-border)'}
          />
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowModal(true)}
          style={{
            minHeight: 44, minWidth: 44, padding: '0 16px',
            background: 'var(--c-primary)', color: '#fff',
            border: 'none', borderRadius: 'var(--r-sm)',
            cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', gap: 6,
            fontSize: 14, fontWeight: 600,
          }}
        >
          <Plus size={16} />
          Add
        </motion.button>
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 16 }}>
        {FILTERS.map(({ value, label }) => {
          const count = value !== 'all' ? counts[value] : words.length
          const active = filter === value
          return (
            <button
              key={value}
              onClick={() => setFilter(value)}
              style={{
                flexShrink: 0, padding: '5px 14px',
                borderRadius: 99, fontSize: 13, fontWeight: 500,
                cursor: 'pointer', transition: 'all 0.15s ease',
                border: active ? 'none' : '1px solid var(--c-border)',
                background: active ? 'var(--c-primary)' : 'var(--c-bg)',
                color: active ? '#fff' : 'var(--c-text-muted)',
              }}
            >
              {label}
              <span style={{ marginLeft: 5, opacity: 0.75 }}>{count}</span>
            </button>
          )
        })}
      </div>

      {/* Word list */}
      {wordsLoading ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--c-text-muted)' }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
            style={{
              width: 28, height: 28, margin: '0 auto 12px',
              border: '2.5px solid var(--c-border)',
              borderTopColor: 'var(--c-primary)',
              borderRadius: '50%',
            }}
          />
          Loading your words…
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ textAlign: 'center', padding: '48px 20px' }}
        >
          <BookOpen size={40} color="var(--c-border)" style={{ margin: '0 auto 14px', display: 'block' }} />
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--c-text)', marginBottom: 6 }}>
            {words.length === 0 ? 'No words yet' : 'No results'}
          </div>
          <div style={{ fontSize: 14, color: 'var(--c-text-muted)', marginBottom: 20 }}>
            {words.length === 0
              ? 'Add your first SAT word to get started'
              : 'Try a different search or filter'}
          </div>
          {words.length === 0 && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowModal(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '10px 24px',
                background: 'var(--c-primary)', color: '#fff',
                border: 'none', borderRadius: 99,
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}
            >
              <Plus size={15} />
              Add first word
            </motion.button>
          )}
        </motion.div>
      ) : (
        <div>
          <div style={{ fontSize: 12, color: 'var(--c-text-muted)', marginBottom: 10 }}>
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

      {/* Add modal */}
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