import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Plus, Trash2, BookOpen, Sparkles, Edit2, ChevronRight
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'

/**
 * VocabBank Page - Simple & Direct
 *
 * - Search curriculum words by name
 * - Add to next session + custom word bucket
 * - Same-page interface (no modal)
 * - Edit/remove custom words
 */

// Sample curriculum words (would be fetched from DB)
const SAMPLE_CURRICULUM = [
  { word: 'Ambiguous', def: 'Open to multiple interpretations' },
  { word: 'Benevolent', def: 'Kindly; showing goodwill' },
  { word: 'Ephemeral', def: 'Lasting for only a short time' },
  { word: 'Perspicacious', def: 'Having keen insight or understanding' },
  { word: 'Sanguine', def: 'Optimistic or positive' },
  { word: 'Recalcitrant', def: 'Stubbornly resisting authority' },
  { word: 'Garrulous', def: 'Extremely talkative' },
  { word: 'Nascent', def: 'Just beginning to develop' },
  { word: 'Perfidious', def: 'Deceitful and untrustworthy' },
  { word: 'Equivocate', def: 'Use ambiguous language to avoid commitment' },
  { word: 'Acrimonious', def: 'Bitter; harsh in tone' },
  { word: 'Tendentious', def: 'Promoting a particular point of view' },
  { word: 'Obfuscate', def: 'Make unclear or obscure' },
  { word: 'Sagacious', def: 'Having good judgment; wise' },
  { word: 'Aberrant', def: 'Departing from usual standards' },
  { word: 'Quixotic', def: 'Exceedingly idealistic; unrealistic' },
  { word: 'Pellucid', def: 'Clear and easy to understand' },
  { word: 'Obsequious', def: 'Excessively obedient or servile' },
  { word: 'Intractable', def: 'Difficult to manage or control' },
  { word: 'Sesquipedalian', def: 'Characterized by long words' },
]

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
      fontSize: 10, fontWeight: 600,
      padding: '2px 8px', borderRadius: 99,
      background: s.bg, color: s.color,
    }}>
      {s.label}
    </span>
  )
}

// ─── Word Search Result Card ──────────────────────────────────────────────────

function SearchResultCard({ word, definition, onAdd, isAdded, onReveal, revealed }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'var(--c-bg)',
        border: '1px solid var(--c-border)',
        borderRadius: 'var(--r-card)',
        padding: '14px 16px',
        marginBottom: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}
      onMouseOver={e => {
        e.currentTarget.style.borderColor = 'var(--c-primary)'
        e.currentTarget.style.boxShadow = '0 1px 6px rgba(139,26,46,0.12)'
      }}
      onMouseOut={e => {
        e.currentTarget.style.borderColor = 'var(--c-border)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Word info */}
      <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => onReveal && onReveal()}>
        <div style={{
          fontSize: 15,
          fontWeight: 700,
          color: 'var(--c-text)',
          marginBottom: 4,
        }}>
          {word}
        </div>
        
        {revealed || !onReveal ? (
          <div style={{
            fontSize: 13,
            color: 'var(--c-text-muted)',
            lineHeight: 1.4,
          }}>
            {definition}
          </div>
        ) : (
          <div style={{
            fontSize: 12,
            color: 'var(--c-primary)',
            fontWeight: 500,
          }}>
            Reveal definition →
          </div>
        )}
      </div>

      {/* Add button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onAdd}
        disabled={isAdded}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          padding: '8px 16px',
          background: isAdded ? 'var(--c-success)' : 'var(--c-primary)',
          color: '#fff',
          border: 'none',
          borderRadius: 'var(--r-sm)',
          fontSize: 12,
          fontWeight: 700,
          cursor: isAdded ? 'default' : 'pointer',
          opacity: isAdded ? 0.7 : 1,
          minWidth: 100,
          transition: 'all 0.2s ease',
        }}
      >
        {isAdded ? '✓ Added' : <>
          <Plus size={14} />
          Add
        </>}
      </motion.button>
    </motion.div>
  )
}

// ─── Custom Word Item ────────────────────────────────────────────────────────

function CustomWordItem({ word, definition, onDelete }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      style={{
        background: 'var(--c-bg-subtle)',
        border: '1px solid var(--c-border)',
        borderRadius: 'var(--r-card)',
        padding: '12px 14px',
        marginBottom: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
      }}
    >
      {/* Info */}
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: 14,
          fontWeight: 700,
          color: 'var(--c-text)',
          marginBottom: 2,
        }}>
          {word}
        </div>
        <div style={{
          fontSize: 12,
          color: 'var(--c-text-muted)',
          lineHeight: 1.3,
        }}>
          {definition}
        </div>
      </div>

      {/* Delete button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => onDelete(word)}
        title="Delete"
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: 'var(--c-danger-pale)',
          border: '1px solid var(--c-border)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--c-danger)',
        }}
      >
        <Trash2 size={14} />
      </motion.button>
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