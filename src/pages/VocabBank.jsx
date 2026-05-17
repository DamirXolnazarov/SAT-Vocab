import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Plus, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'

/**
 * VocabBank Page - Simple & Direct
 *
 * - Search curriculum words by name only
 * - Add to next incomplete session + personal bucket
 * - Same-page interface (no modal)
 * - View/edit custom words
 */

// Sample curriculum words (10 words × 138 units = 1,380 total)
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

// ─── Search Result Card ────────────────────────────────────────────────────

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

// ─── VocabBank Main ────────────────────────────────────────────────────────────

export function VocabBank() {
  const { profile } = useAuthStore()
  
  const [search, setSearch] = useState('')
  const [revealedWords, setRevealedWords] = useState(new Set())
  const [customWords, setCustomWords] = useState([])
  const [addedWords, setAddedWords] = useState(new Set())
  const [loading, setLoading] = useState(false)
  const [nextIncompleteUnit, setNextIncompleteUnit] = useState(null)

  // Load custom words and find next incomplete unit on mount
  useEffect(() => {
    if (!profile?.id) return
    
    const init = async () => {
      setLoading(true)
      try {
        // Fetch custom words from user_words table
        const { data: customData, error: customError } = await supabase
          .from('user_words')
          .select('*')
          .eq('user_id', profile.id)

        if (customError) throw customError
        setCustomWords(customData || [])
        setAddedWords(new Set(customData?.map(w => w.word.toLowerCase()) || []))

        // Find next incomplete unit
        const { data: unitData, error: unitError } = await supabase
          .from('user_units')
          .select('unit_id')
          .eq('user_id', profile.id)
          .neq('state', 'completed')
          .order('unit_id', { ascending: true })
          .limit(1)
          .maybeSingle()

        // If no incomplete unit found, default to unit 1 (user's first unit)
        if (!unitError && unitData) {
          setNextIncompleteUnit(unitData.unit_id)
        } else {
          setNextIncompleteUnit(1)
        }
      } catch (err) {
        console.error('Error loading VocabBank:', err)
        setNextIncompleteUnit(1) // Default to unit 1 on error
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [profile?.id])

  // Toggle reveal definition
  const toggleReveal = (word) => {
    const newRevealed = new Set(revealedWords)
    if (newRevealed.has(word)) {
      newRevealed.delete(word)
    } else {
      newRevealed.add(word)
    }
    setRevealedWords(newRevealed)
  }

  // Add word to user_words and target unit
  const handleAddWord = async (word, def) => {
    if (!profile?.id) {
      alert('Please log in to add words.')
      return
    }

    try {
      // Insert to user_words (personal bucket)
      const { error: insertError } = await supabase
        .from('user_words')
        .insert({
          user_id: profile.id,
          word,
          definition: def,
          target_unit_id: nextIncompleteUnit || 1,
          added_at: new Date(),
        })

      if (insertError) throw insertError

      // Update local state
      setAddedWords(new Set(addedWords).add(word.toLowerCase()))
      setCustomWords([
        ...customWords,
        { word, definition: def, target_unit_id: nextIncompleteUnit || 1 }
      ])
    } catch (err) {
      console.error('Error adding word:', err)
      alert('Failed to add word')
    }
  }

  // Delete custom word
  const handleDeleteWord = async (word) => {
    if (!profile?.id) return

    try {
      const { error } = await supabase
        .from('user_words')
        .delete()
        .eq('user_id', profile.id)
        .eq('word', word)

      if (error) throw error

      setCustomWords(customWords.filter(w => w.word !== word))
      const newAdded = new Set(addedWords)
      newAdded.delete(word.toLowerCase())
      setAddedWords(newAdded)
    } catch (err) {
      console.error('Error deleting word:', err)
      alert('Failed to delete word')
    }
  }

  // Filter search results (by word name only)
  const searchTerm = search.toLowerCase()
  const filteredResults = SAMPLE_CURRICULUM.filter(w =>
    w.word.toLowerCase().includes(searchTerm)
  )

  return (
    <div style={{ maxWidth: 600 }}>
      {/* Search Box */}
      <div style={{ position: 'relative', marginBottom: 24 }}>
        <Search
          size={16}
          color="var(--c-text-muted)"
          style={{
            position: 'absolute',
            left: 14,
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
          }}
        />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search words…"
          style={{
            width: '100%',
            padding: '12px 14px 12px 40px',
            fontSize: 14,
            background: 'var(--c-bg)',
            border: '1px solid var(--c-border)',
            borderRadius: 'var(--r-sm)',
            color: 'var(--c-text)',
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.15s ease',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--c-primary)'}
          onBlur={e => e.target.style.borderColor = 'var(--c-border)'}
        />
      </div>

      {/* Search Results */}
      {search.trim() && (
        <div style={{ marginBottom: 32 }}>
          <div style={{
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--c-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: 12,
            paddingLeft: 4,
          }}>
            Curriculum Words
          </div>
          {filteredResults.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '24px 16px',
              color: 'var(--c-text-muted)',
              fontSize: 13,
            }}>
              No words found
            </div>
          ) : (
            <div>
              {filteredResults.map(w => (
                <SearchResultCard
                  key={w.word}
                  word={w.word}
                  definition={w.def}
                  isAdded={addedWords.has(w.word.toLowerCase())}
                  revealed={revealedWords.has(w.word)}
                  onReveal={() => toggleReveal(w.word)}
                  onAdd={() => handleAddWord(w.word, w.def)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Custom Words Section */}
      <div>
        <div style={{
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--c-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: 12,
          paddingLeft: 4,
        }}>
          My Words ({customWords.length})
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--c-text-muted)' }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              style={{
                width: 24,
                height: 24,
                margin: '0 auto 12px',
                border: '2px solid var(--c-border)',
                borderTopColor: 'var(--c-primary)',
                borderRadius: '50%',
              }}
            />
            Loading…
          </div>
        ) : customWords.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              textAlign: 'center',
              padding: '32px 16px',
              color: 'var(--c-text-muted)',
              fontSize: 13,
            }}
          >
            No custom words yet. Search above to add your first word!
          </motion.div>
        ) : (
          <AnimatePresence>
            {customWords.map(w => (
              <CustomWordItem
                key={w.word}
                word={w.word}
                definition={w.definition}
                onDelete={handleDeleteWord}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}

export default VocabBank