import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { useUserStore } from '../stores/userStore'

// ─── Difficulty badge ─────────────────────────────────────────────────────────

function DifficultyBadge({ rating }) {
  const styles = {
    easy:   { bg: 'var(--c-success-pale)',  color: 'var(--c-success)' },
    medium: { bg: 'var(--c-warning-pale)',  color: 'var(--c-warning)' },
    hard:   { bg: 'var(--c-danger-pale)',   color: 'var(--c-danger)'  },
  }
  const s = styles[rating] || styles.medium
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: '2px 8px',
      borderRadius: 99, background: s.bg, color: s.color,
      textTransform: 'capitalize',
    }}>
      {rating || 'medium'}
    </span>
  )
}

// ─── Word result card ─────────────────────────────────────────────────────────

function WordResultCard({ wordData, onAdd, alreadyAdded }) {
  const [expanded, setExpanded] = useState(false)
  const [adding,   setAdding]   = useState(false)
const [showSearch, setShowSearch] = useState(false)

  const handleAdd = async () => {
    setAdding(true)
    try {
      await onAdd(wordData)
    } finally {
      setAdding(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'var(--c-bg)',
        border: '1px solid var(--c-border)',
        borderRadius: 'var(--r-card)',
        overflow: 'hidden',
      }}
    >
      {/* Main row */}
      <div style={{ padding: '16px 16px 0' }}>
        {/* Word header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--c-text)' }}>
                {wordData.word}
              </span>
              {wordData.part_of_speech && (
                <span style={{ fontSize: 12, color: 'var(--c-primary)', fontWeight: 500 }}>
                  {wordData.part_of_speech}
                </span>
              )}
              <DifficultyBadge rating={wordData.difficulty_rating} />
            </div>
            {wordData.pronunciation && (
              <div style={{ fontSize: 13, color: 'var(--c-text-muted)' }}>
                {wordData.pronunciation}
              </div>
            )}
          </div>

          {/* Add button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleAdd}
            disabled={alreadyAdded || adding}
            style={{
              flexShrink: 0,
              minWidth: 80, minHeight: 36,
              padding: '0 14px',
              background: alreadyAdded ? 'var(--c-success-pale)' : 'var(--c-primary)',
              color: alreadyAdded ? 'var(--c-success)' : '#fff',
              border: alreadyAdded ? '1px solid var(--c-success)' : 'none',
              borderRadius: 'var(--r-pill)',
              fontSize: 13, fontWeight: 600,
              cursor: alreadyAdded ? 'default' : adding ? 'wait' : 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            }}
          >
            {adding ? (
              <span style={{
                width: 14, height: 14,
                border: '2px solid rgba(255,255,255,0.3)',
                borderTopColor: '#fff',
                borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
                display: 'inline-block',
              }} />
            ) : alreadyAdded ? (
              '✓ Added'
            ) : (
              '+ Add'
            )}
          </motion.button>
        </div>

        {/* Definition */}
        <p style={{ fontSize: 15, color: 'var(--c-text)', lineHeight: 1.6, marginBottom: 12 }}>
          {wordData.definition}
        </p>

        {/* Example sentence 1 */}
        {wordData.example_sentence_1 && (
          <div style={{
            background: 'var(--c-bg-subtle)',
            borderRadius: 'var(--r-sm)',
            padding: '10px 12px',
            marginBottom: 12,
            borderLeft: '3px solid var(--c-primary)',
          }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--c-text-muted)', marginBottom: 3 }}>
              EXAMPLE
            </div>
            <div style={{ fontSize: 13, color: 'var(--c-text)', fontStyle: 'italic', lineHeight: 1.5 }}>
              "{wordData.example_sentence_1}"
            </div>
          </div>
        )}

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(e => !e)}
          style={{
            background: 'none', border: 'none',
            color: 'var(--c-primary)', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', padding: '0 0 14px',
            display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          {expanded ? '▲ Less details' : '▼ More details'}
        </button>
      </div>

      {/* Expanded section */}
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
              display: 'flex', flexDirection: 'column', gap: 12,
            }}>

              {/* Second example */}
              {wordData.example_sentence_2 && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--c-text-muted)', marginBottom: 4 }}>
                    SECOND EXAMPLE
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--c-text)', fontStyle: 'italic', lineHeight: 1.5 }}>
                    "{wordData.example_sentence_2}"
                  </div>
                </div>
              )}

              {/* Mnemonic */}
              {wordData.mnemonic_hint && (
                <div style={{
                  background: 'var(--c-gold-pale)',
                  border: '1px solid var(--c-gold-light)',
                  borderRadius: 'var(--r-sm)',
                  padding: '10px 12px',
                }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--c-gold)', marginBottom: 4 }}>
                    💡 MEMORY TRICK
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--c-text)', lineHeight: 1.5 }}>
                    {wordData.mnemonic_hint}
                  </div>
                </div>
              )}

              {/* Synonyms + Antonyms */}
              <div style={{ display: 'flex', gap: 12 }}>
                {wordData.synonyms?.length > 0 && (
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--c-text-muted)', marginBottom: 6 }}>
                      SYNONYMS
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {wordData.synonyms.slice(0, 5).map(s => (
                        <span key={s} style={{
                          fontSize: 11, padding: '3px 8px',
                          background: 'var(--c-primary-pale)',
                          color: 'var(--c-primary)',
                          borderRadius: 99, fontWeight: 500,
                        }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {wordData.antonyms?.length > 0 && (
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--c-text-muted)', marginBottom: 6 }}>
                      ANTONYMS
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {wordData.antonyms.slice(0, 5).map(a => (
                        <span key={a} style={{
                          fontSize: 11, padding: '3px 8px',
                          background: 'var(--c-danger-pale)',
                          color: 'var(--c-danger)',
                          borderRadius: 99, fontWeight: 500,
                        }}>
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Confusable */}
              {wordData.confusable_word && (
                <div style={{
                  background: 'var(--c-bg-subtle)',
                  borderRadius: 'var(--r-sm)',
                  padding: '10px 12px',
                }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--c-text-muted)', marginBottom: 4 }}>
                    ⚠️ DON'T CONFUSE WITH
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-text)' }}>
                    {wordData.confusable_word}
                  </span>
                  {wordData.confusable_explanation && (
                    <span style={{ fontSize: 13, color: 'var(--c-text-muted)' }}>
                      {' '}— {wordData.confusable_explanation}
                    </span>
                  )}
                </div>
              )}

              {/* Etymology */}
              {wordData.etymology && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--c-text-muted)', marginBottom: 4 }}>
                    📜 ETYMOLOGY
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--c-text)', lineHeight: 1.5 }}>
                    {wordData.etymology}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── AI loading state ─────────────────────────────────────────────────────────

function AILoading({ word }) {
  const steps = [
    'Searching the dictionary…',
    'Generating definition…',
    'Building example sentences…',
    'Creating memory tricks…',
    'Almost done…',
  ]
  const [step, setStep] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setStep(s => Math.min(s + 1, steps.length - 1))
    }, 1200)
    return () => clearInterval(interval)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'var(--c-bg)',
        border: '1px solid var(--c-border)',
        borderRadius: 'var(--r-card)',
        padding: '24px',
        textAlign: 'center',
      }}
    >
      {/* Spinner */}
      <div style={{
        width: 40, height: 40, margin: '0 auto 16px',
        border: '3px solid var(--c-primary-pale)',
        borderTopColor: 'var(--c-primary)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />

      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--c-text)', marginBottom: 4 }}>
        Looking up "{word}"
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          style={{ fontSize: 13, color: 'var(--c-text-muted)' }}
        >
          {steps[step]}
        </motion.div>
      </AnimatePresence>

      <div style={{
        marginTop: 16, fontSize: 11,
        color: 'var(--c-primary)',
        background: 'var(--c-primary-pale)',
        padding: '4px 12px', borderRadius: 99,
        display: 'inline-block',
      }}>
        ✨ AI enriching from scratch
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </motion.div>
  )
}

// ─── WordSearch ───────────────────────────────────────────────────────────────

export function WordSearch({ onClose }) {
  const { profile } = useAuthStore()
  const { words, addWord } = useUserStore()

  const [query,       setQuery]       = useState('')
  const [results,     setResults]     = useState([])  // from word_bank
  const [aiResult,    setAIResult]    = useState(null) // AI-generated
  const [searching,   setSearching]   = useState(false)
  const [aiLoading,   setAILoading]   = useState(false)
  const [error,       setError]       = useState('')
  const [addedWords,  setAddedWords]  = useState(new Set())

  const inputRef = useRef(null)
  const debounceRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // My words ids for "already added" check
  const myWordNames = new Set(words.map(w => w.word.toLowerCase()))

  const searchWordBank = async (q) => {
    if (!q || q.length < 2) {
      setResults([])
      setAIResult(null)
      return
    }

    setSearching(true)
    setError('')
    setAIResult(null)

    try {
      const { data, error: dbError } = await supabase
        .from('word_bank')
        .select('*')
        .ilike('word', `%${q}%`)
        .order('word', { ascending: true })
        .limit(8)

      if (dbError) throw dbError
      setResults(data || [])
    } catch (err) {
      setError('Search failed. Please try again.')
    } finally {
      setSearching(false)
    }
  }

  const handleInput = (e) => {
    const val = e.target.value
    setQuery(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => searchWordBank(val.trim()), 350)
  }

  // User hits Enter or clicks "Look up exact word" — triggers AI if not found
  const handleExactLookup = async () => {
    const q = query.trim()
    if (!q) return

    // Check if exact match already in results
    const exact = results.find(r => r.word.toLowerCase() === q.toLowerCase())
    if (exact) {
      setResults([exact, ...results.filter(r => r.id !== exact.id)])
      return
    }

    // Not found — call edge function
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
          body: JSON.stringify({ word: q }),
        }
      )

      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const json = await res.json()
      if (json.error) throw new Error(json.error)

      setAIResult(json.word)
    } catch (err) {
      setError(err.message || 'Could not look up word. Check your connection.')
    } finally {
      setAILoading(false)
    }
  }

  const handleAdd = async (wordData) => {
    if (!profile?.id) return

    await addWord({
      user_id:                wordData.user_id || profile.id,
      word:                   wordData.word,
      definition:             wordData.definition,
      pronunciation:          wordData.pronunciation || null,
      part_of_speech:         wordData.part_of_speech || null,
      etymology:              wordData.etymology || null,
      origin_story:           wordData.origin_story || null,
      mnemonic_hint:          wordData.mnemonic_hint || null,
      confusable_word:        wordData.confusable_word || null,
      confusable_explanation: wordData.confusable_explanation || null,
      synonyms:               wordData.synonyms || [],
      antonyms:               wordData.antonyms || [],
      example_sentence_1:     wordData.example_sentence_1 || null,
      example_sentence_2:     wordData.example_sentence_2 || null,
      difficulty_rating:      wordData.difficulty_rating || 'medium',
      state:                  'new',
      mastery_score:          0,
    })

    setAddedWords(prev => new Set([...prev, wordData.word.toLowerCase()]))
  }

  const exactMatchInResults = results.length > 0 &&
    results[0].word.toLowerCase() === query.trim().toLowerCase()

  const showLookupButton = query.trim().length >= 2 &&
    !searching && !aiLoading && !exactMatchInResults

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'flex-start',
        paddingTop: 60,
      }}
    >
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 560,
          margin: '0 auto',
          background: 'var(--c-bg)',
          borderRadius: 'var(--r-card)',
          overflow: 'hidden',
          maxHeight: 'calc(100vh - 100px)',
          display: 'flex', flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* Search input */}
        <div style={{
          padding: '16px 16px 12px',
          borderBottom: '1px solid var(--c-border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>🔍</span>
            <input
              ref={inputRef}
              value={query}
              onChange={handleInput}
              onKeyDown={e => e.key === 'Enter' && handleExactLookup()}
              placeholder="Search any word…"
              style={{
                flex: 1, fontSize: 18, fontWeight: 500,
                border: 'none', outline: 'none',
                background: 'transparent',
                color: 'var(--c-text)',
              }}
            />
            {query && (
              <button
                onClick={() => { setQuery(''); setResults([]); setAIResult(null) }}
                style={{
                  background: 'none', border: 'none',
                  color: 'var(--c-text-muted)', fontSize: 18,
                  cursor: 'pointer', padding: 4,
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* AI lookup button */}
          <AnimatePresence>
            {showLookupButton && (
              <motion.button
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onClick={handleExactLookup}
                style={{
                  width: '100%', marginTop: 10,
                  padding: '10px 0',
                  background: 'var(--c-primary-pale)',
                  border: '1px dashed var(--c-primary)',
                  borderRadius: 'var(--r-sm)',
                  color: 'var(--c-primary)',
                  fontSize: 13, fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                <span>✨</span>
                Look up "{query}" with AI
                <span style={{ fontSize: 11, opacity: 0.7 }}>↵ Enter</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Results */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '12px 16px 20px' }}>

          {/* Error */}
          {error && (
            <div style={{
              padding: '10px 14px', marginBottom: 12,
              background: 'var(--c-danger-pale)', color: 'var(--c-danger)',
              borderRadius: 'var(--r-sm)', fontSize: 13,
            }}>
              {error}
            </div>
          )}

          {/* AI loading */}
          {aiLoading && <AILoading word={query} />}

          {/* AI result */}
          {aiResult && !aiLoading && (
            <div style={{ marginBottom: 12 }}>
              <div style={{
                fontSize: 11, fontWeight: 600, color: 'var(--c-primary)',
                marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <span>✨</span> AI generated — saved to word bank
              </div>
              <WordResultCard
                wordData={aiResult}
                onAdd={handleAdd}
                alreadyAdded={
                  myWordNames.has(aiResult.word.toLowerCase()) ||
                  addedWords.has(aiResult.word.toLowerCase())
                }
              />
            </div>
          )}

          {/* Word bank results */}
          {searching ? (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--c-text-muted)', fontSize: 14 }}>
              Searching…
            </div>
          ) : results.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {results.length > 0 && (
                <div style={{ fontSize: 11, color: 'var(--c-text-muted)', marginBottom: 2 }}>
                  {results.length} result{results.length !== 1 ? 's' : ''} in word bank
                </div>
              )}
              {results.map(word => (
                <WordResultCard
                  key={word.id}
                  wordData={word}
                  onAdd={handleAdd}
                  alreadyAdded={
                    myWordNames.has(word.word.toLowerCase()) ||
                    addedWords.has(word.word.toLowerCase())
                  }
                />
              ))}
            </div>
          ) : query.length >= 2 && !aiLoading && !aiResult ? (
            <div style={{ textAlign: 'center', padding: '32px 20px' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🔎</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--c-text)', marginBottom: 6 }}>
                No results for "{query}"
              </div>
              <div style={{ fontSize: 13, color: 'var(--c-text-muted)', marginBottom: 16 }}>
                Press Enter or tap the button above to look it up with AI
              </div>
            </div>
          ) : !query ? (
            <div style={{ textAlign: 'center', padding: '32px 20px' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📖</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--c-text)', marginBottom: 6 }}>
                Search 1,380+ SAT words
              </div>
              <div style={{ fontSize: 13, color: 'var(--c-text-muted)' }}>
                From your book — or any word in the English language
              </div>
            </div>
          ) : null}

          <button onClick={() => setShowSearch(true)}>🔍 Search words</button>

{showSearch && <WordSearch onClose={() => setShowSearch(false)} />}
        </div>
      </motion.div>
    </motion.div>
  )
}