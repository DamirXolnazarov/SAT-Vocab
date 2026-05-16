import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, CheckCircle, XCircle, ChevronRight, Zap } from 'lucide-react'

/**
 * ComprehensiveTest Component
 *
 * 30 questions (10 easy, 10 medium, 10 hard)
 * All 4 types equally distributed:
 * - Definition (choose meaning)
 * - Usage (correct sentence)
 * - Synonym (find similar word)
 * - Fill-blank (complete sentence)
 *
 * 70% pass threshold (21/30)
 * Can retake
 * Timer display (no restrictions)
 */

// Sample comprehensive test data (would be generated from DB in production)
const SAMPLE_TEST_QUESTIONS = [
  // EASY (Questions 1-10)
  {
    type: 'definition',
    difficulty: 'easy',
    question: 'What does "benevolent" mean?',
    word: 'benevolent',
    options: [
      'Kindly; showing goodwill',
      'Hostile; aggressive',
      'Uncertain; hesitant',
      'Verbose; talkative',
    ],
    correct: 0,
    explanation: 'Benevolent describes someone kind and charitable.',
  },
  {
    type: 'usage',
    difficulty: 'easy',
    question: 'Which sentence uses "ambiguous" correctly?',
    word: 'ambiguous',
    options: [
      'The instructions were ambiguous, so everyone understood them perfectly.',
      'The instructions were ambiguous, leaving multiple interpretations.',
      'She was ambiguous about her love for coffee.',
      'The weather was ambiguous.',
    ],
    correct: 1,
    explanation: '"Ambiguous" means unclear or open to multiple interpretations.',
  },
  {
    type: 'synonym',
    difficulty: 'easy',
    question: 'Which word is most similar to "ephemeral"?',
    word: 'ephemeral',
    options: [
      'Permanent',
      'Transient',
      'Solid',
      'Continuous',
    ],
    correct: 1,
    explanation: 'Transient and ephemeral both mean lasting only briefly.',
  },
  {
    type: 'fill_blank',
    difficulty: 'easy',
    question: 'The flowers were _____, lasting only a few days.',
    word: 'ephemeral',
    options: [
      'persistent',
      'robust',
      'ephemeral',
      'eternal',
    ],
    correct: 2,
    explanation: 'Ephemeral describes things that don\'t last long.',
  },
  {
    type: 'definition',
    difficulty: 'easy',
    question: 'What does "perspicacious" mean?',
    word: 'perspicacious',
    options: [
      'Having keen insight or understanding',
      'Being physically strong',
      'Easily confused',
      'Very tall',
    ],
    correct: 0,
    explanation: 'Perspicacious means having sharp judgment and insight.',
  },
  {
    type: 'usage',
    difficulty: 'easy',
    question: 'Which uses "garrulous" correctly?',
    word: 'garrulous',
    options: [
      'He was garrulous, barely speaking a word.',
      'She was garrulous, talking continuously about unimportant things.',
      'The garrulous stone was very hard.',
      'His garrulous behavior was quiet.',
    ],
    correct: 1,
    explanation: 'Garrulous means extremely talkative, especially about trivial matters.',
  },
  {
    type: 'synonym',
    difficulty: 'easy',
    question: 'Which word means the same as "nascent"?',
    word: 'nascent',
    options: [
      'Mature',
      'Complete',
      'Emerging',
      'Finished',
    ],
    correct: 2,
    explanation: 'Nascent means just beginning to develop or emerge.',
  },
  {
    type: 'fill_blank',
    difficulty: 'easy',
    question: 'The _____ company showed great promise despite its youth.',
    word: 'nascent',
    options: [
      'established',
      'ancient',
      'nascent',
      'obsolete',
    ],
    correct: 2,
    explanation: 'Nascent describes something newly beginning.',
  },
  {
    type: 'definition',
    difficulty: 'easy',
    question: 'What does "sanguine" mean?',
    word: 'sanguine',
    options: [
      'Optimistic or positive',
      'Sad or depressed',
      'Confused or lost',
      'Angry or violent',
    ],
    correct: 0,
    explanation: 'Sanguine means optimistic or positive about the future.',
  },
  {
    type: 'usage',
    difficulty: 'easy',
    question: 'How is "recalcitrant" used correctly?',
    word: 'recalcitrant',
    options: [
      'The recalcitrant student eagerly did the homework.',
      'The recalcitrant child refused to obey and was stubborn.',
      'She had a recalcitrant attitude about helping.',
      'He was recalcitrant and very cooperative.',
    ],
    correct: 1,
    explanation: 'Recalcitrant means stubbornly resisting authority or control.',
  },

  // MEDIUM (Questions 11-20)
  {
    type: 'definition',
    difficulty: 'medium',
    question: 'What does "perfidious" most accurately mean?',
    word: 'perfidious',
    options: [
      'Charming and witty',
      'Deceitful and untrustworthy',
      'Physically perfect',
      'Extremely polite',
    ],
    correct: 1,
    explanation: 'Perfidious describes betrayal and deliberate untrustworthiness.',
  },
  {
    type: 'usage',
    difficulty: 'medium',
    question: 'Which sentence best demonstrates "equivocate"?',
    word: 'equivocate',
    options: [
      'She equivocated her love for the project by completing it immediately.',
      'When asked directly, he equivocated with vague answers to avoid commitment.',
      'The equivocated sunrise was beautiful.',
      'They equivocated the problem by solving it completely.',
    ],
    correct: 1,
    explanation: 'Equivocate means to use ambiguous language to avoid making a commitment.',
  },
  {
    type: 'synonym',
    difficulty: 'medium',
    question: 'Which word most closely resembles "acrimonious"?',
    word: 'acrimonious',
    options: [
      'Sweet',
      'Harmonious',
      'Bitter',
      'Neutral',
    ],
    correct: 2,
    explanation: 'Acrimonious means bitter or harsh in tone.',
  },
  {
    type: 'fill_blank',
    difficulty: 'medium',
    question: 'The _____ treaty was signed after years of bitter negotiations.',
    word: 'acrimonious',
    options: [
      'sweet',
      'acrimonious',
      'friendly',
      'pleasant',
    ],
    correct: 1,
    explanation: 'Acrimonious describes harsh, bitter disputes.',
  },
  {
    type: 'definition',
    difficulty: 'medium',
    question: 'What is the primary meaning of "tendentious"?',
    word: 'tendentious',
    options: [
      'Having a tendency to stretch',
      'Promoting a particular cause or viewpoint',
      'Extremely careful and cautious',
      'Related to physical tenderness',
    ],
    correct: 1,
    explanation: 'Tendentious means promoting a particular point of view, often biased.',
  },
  {
    type: 'usage',
    difficulty: 'medium',
    question: 'How does "obfuscate" function in context?',
    word: 'obfuscate',
    options: [
      'To make something clear and simple',
      'To make something unclear or obscure',
      'To organize information logically',
      'To beautify something',
    ],
    correct: 1,
    explanation: 'Obfuscate means to make unclear or confuse deliberately.',
  },
  {
    type: 'synonym',
    difficulty: 'medium',
    question: 'Which word is closest in meaning to "sagacious"?',
    word: 'sagacious',
    options: [
      'Foolish',
      'Wise',
      'Sad',
      'Rapid',
    ],
    correct: 1,
    explanation: 'Sagacious means having good judgment and wisdom.',
  },
  {
    type: 'fill_blank',
    difficulty: 'medium',
    question: 'His _____ observations about human nature impressed everyone.',
    word: 'sagacious',
    options: [
      'foolish',
      'obvious',
      'sagacious',
      'meaningless',
    ],
    correct: 2,
    explanation: 'Sagacious describes wise and insightful observations.',
  },
  {
    type: 'definition',
    difficulty: 'medium',
    question: 'What does "aberrant" primarily mean?',
    word: 'aberrant',
    options: [
      'Following all rules carefully',
      'Departing from usual or expected standards',
      'Moving in one direction',
      'Very similar to others',
    ],
    correct: 1,
    explanation: 'Aberrant means deviating from normal or expected behavior.',
  },
  {
    type: 'usage',
    difficulty: 'medium',
    question: 'Which uses "quixotic" correctly?',
    word: 'quixotic',
    options: [
      'His quixotic plan was based on careful market research.',
      'She had a quixotic vision of changing the world through idealism.',
      'The quixotic bridge was sturdy.',
      'He made a quixotic and practical decision.',
    ],
    correct: 1,
    explanation: 'Quixotic means exceedingly idealistic and unrealistic.',
  },

  // HARD (Questions 21-30)
  {
    type: 'definition',
    difficulty: 'hard',
    question: 'What is the most nuanced definition of "perspicacity"?',
    word: 'perspicacity',
    options: [
      'Physical beauty or appearance',
      'Keen discernment and understanding of subtle distinctions',
      'The ability to speak many languages',
      'Physical strength and endurance',
    ],
    correct: 1,
    explanation: 'Perspicacity is the quality of having keen insight into complex matters.',
  },
  {
    type: 'usage',
    difficulty: 'hard',
    question: 'In which context is "pellucid" used most appropriately?',
    word: 'pellucid',
    options: [
      'His pellucid explanation confused everyone further.',
      'The pellucid prose made complex ideas easy to understand.',
      'Her pellucid anger was evident.',
      'The pellucid storm lasted for days.',
    ],
    correct: 1,
    explanation: 'Pellucid means clear and easy to understand.',
  },
  {
    type: 'synonym',
    difficulty: 'hard',
    question: 'Which word is the closest synonym for "obsequious"?',
    word: 'obsequious',
    options: [
      'Independent',
      'Rebellious',
      'Servile',
      'Confident',
    ],
    correct: 2,
    explanation: 'Obsequious means excessively obedient or servile.',
  },
  {
    type: 'fill_blank',
    difficulty: 'hard',
    question: 'The _____ nature of the conflict made it difficult to resolve.',
    word: 'intractable',
    options: [
      'simple',
      'minor',
      'intractable',
      'brief',
    ],
    correct: 2,
    explanation: 'Intractable means difficult or impossible to manage or control.',
  },
  {
    type: 'definition',
    difficulty: 'hard',
    question: 'What is the precise meaning of "sesquipedalian"?',
    word: 'sesquipedalian',
    options: [
      'Relating to feet or walking',
      'Characterized by long words; lengthy and complex',
      'Having one and a half legs',
      'Moving in a circular pattern',
    ],
    correct: 1,
    explanation: 'Sesquipedalian describes long, multisyllabic words or verbose speech.',
  },
  {
    type: 'usage',
    difficulty: 'hard',
    question: 'How is "sycophant" used appropriately?',
    word: 'sycophant',
    options: [
      'A sycophant gave honest criticism to the leader.',
      'She was known as a sycophant, always flattering and praising those in power.',
      'His sycophant behavior included challenging authority.',
      'The sycophant trees grew in the forest.',
    ],
    correct: 1,
    explanation: 'A sycophant is a person who uses flattery to gain favor.',
  },
  {
    type: 'synonym',
    difficulty: 'hard',
    question: 'Which word best parallels "pusillanimous"?',
    word: 'pusillanimous',
    options: [
      'Courageous',
      'Cowardly',
      'Ambitious',
      'Knowledgeable',
    ],
    correct: 1,
    explanation: 'Pusillanimous means lacking courage; cowardly.',
  },
  {
    type: 'fill_blank',
    difficulty: 'hard',
    question: 'His _____ arguments lacked substantive evidence.',
    word: 'specious',
    options: [
      'solid',
      'factual',
      'specious',
      'valid',
    ],
    correct: 2,
    explanation: 'Specious means superficially plausible but actually wrong.',
  },
  {
    type: 'definition',
    difficulty: 'hard',
    question: 'What does "ephah" refer to?',
    word: 'ephah',
    options: [
      'A temporary structure',
      'An ancient Hebrew unit of dry measure',
      'A type of philosophy',
      'A brief moment in time',
    ],
    correct: 1,
    explanation: 'An ephah is an ancient Hebrew unit of measurement.',
  },
  {
    type: 'usage',
    difficulty: 'hard',
    question: 'Which best demonstrates "perspicacious" judgment?',
    word: 'perspicacious',
    options: [
      'He made a perspicacious decision without thinking.',
      'Her perspicacious analysis revealed hidden flaws that others overlooked.',
      'His perspicacious mistake cost him everything.',
      'They took a perspicacious and illogical approach.',
    ],
    correct: 1,
    explanation: 'Perspicacious judgment demonstrates keen insight and discernment.',
  },
]

// ─── Timer Component ──────────────────────────────────────────────────────

function TestTimer({ startTime }) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [startTime])

  const minutes = Math.floor(elapsed / 60)
  const seconds = elapsed % 60

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--c-text-muted)',
    }}>
      <Clock size={14} />
      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </div>
  )
}

// ─── Question Component ───────────────────────────────────────────────────

function Question({ q, index, total, onAnswer }) {
  const [selected, setSelected] = useState(null)
  const [answered, setAnswered] = useState(false)

  const handleSelect = (i) => {
    if (answered) return
    setSelected(i)
    setAnswered(true)
    setTimeout(() => onAnswer(i === q.correct), 800)
  }

  const isCorrect = selected === q.correct
  const difficultyLabel = q.difficulty.charAt(0).toUpperCase() + q.difficulty.slice(1)
  const typeLabel = q.type
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        background: 'var(--c-bg)',
        border: '1px solid var(--c-border)',
        borderRadius: 'var(--r-card)',
        padding: '24px',
        marginBottom: 16,
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}>
          <div style={{
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--c-primary)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            Question {index + 1} of {total}
          </div>
          <div style={{
            display: 'flex',
            gap: 8,
            fontSize: 10,
            fontWeight: 600,
          }}>
            <span style={{
              padding: '2px 8px',
              borderRadius: 99,
              background:
                difficultyLabel === 'Easy'
                  ? 'var(--c-success-pale)'
                  : difficultyLabel === 'Medium'
                  ? 'var(--c-warning-pale)'
                  : 'var(--c-danger-pale)',
              color:
                difficultyLabel === 'Easy'
                  ? 'var(--c-success)'
                  : difficultyLabel === 'Medium'
                  ? 'var(--c-warning)'
                  : 'var(--c-danger)',
            }}>
              {difficultyLabel}
            </span>
            <span style={{
              padding: '2px 8px',
              borderRadius: 99,
              background: 'var(--c-primary-pale)',
              color: 'var(--c-primary)',
            }}>
              {typeLabel}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 4, background: 'var(--c-border)', borderRadius: 2, overflow: 'hidden' }}>
          <motion.div
            animate={{ width: `${((index + 1) / total) * 100}%` }}
            transition={{ duration: 0.4 }}
            style={{ height: '100%', background: 'var(--c-primary)', borderRadius: 2 }}
          />
        </div>
      </div>

      {/* Question */}
      <h3 style={{
        fontSize: 18,
        fontWeight: 700,
        color: 'var(--c-text)',
        marginBottom: 20,
        lineHeight: 1.5,
      }}>
        {q.question}
      </h3>

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
        {q.options.map((option, i) => {
          const isSelected = selected === i
          const isCorrectOption = i === q.correct
          let bgColor = 'var(--c-bg-subtle)'
          let borderColor = 'var(--c-border)'
          let textColor = 'var(--c-text)'

          if (answered) {
            if (isCorrectOption) {
              bgColor = 'var(--c-success-pale)'
              borderColor = 'var(--c-success)'
              textColor = 'var(--c-success)'
            } else if (isSelected && !isCorrect) {
              bgColor = 'var(--c-danger-pale)'
              borderColor = 'var(--c-danger)'
              textColor = 'var(--c-danger)'
            }
          } else if (isSelected) {
            bgColor = 'var(--c-primary-pale)'
            borderColor = 'var(--c-primary)'
            textColor = 'var(--c-primary)'
          }

          return (
            <motion.button
              key={i}
              whileTap={!answered ? { scale: 0.98 } : {}}
              onClick={() => handleSelect(i)}
              disabled={answered}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
                padding: '14px 16px',
                background: bgColor,
                border: `2px solid ${borderColor}`,
                borderRadius: 'var(--r-sm)',
                cursor: answered ? 'default' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: answered && !isSelected && !isCorrectOption ? 0.5 : 1,
                textAlign: 'left',
              }}
            >
              {/* Letter badge */}
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: textColor,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                flexShrink: 0,
                fontSize: 14,
              }}>
                {['A', 'B', 'C', 'D'][i]}
              </div>

              {/* Text */}
              <span style={{
                flex: 1,
                fontSize: 15,
                color: textColor,
                fontWeight: 500,
                lineHeight: 1.4,
              }}>
                {option}
              </span>

              {/* Result icon */}
              {answered && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ flexShrink: 0 }}>
                  {isCorrectOption ? (
                    <CheckCircle size={22} color="var(--c-success)" strokeWidth={2} />
                  ) : isSelected && !isCorrect ? (
                    <XCircle size={22} color="var(--c-danger)" strokeWidth={2} />
                  ) : null}
                </motion.div>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Explanation */}
      <AnimatePresence>
        {answered && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: '12px 14px',
              background: isCorrect ? 'var(--c-success-pale)' : 'var(--c-warning-pale)',
              border: `1px solid ${isCorrect ? 'var(--c-success)' : 'var(--c-warning)'}`,
              borderRadius: 'var(--r-sm)',
              fontSize: 13,
              color: isCorrect ? 'var(--c-success)' : 'var(--c-warning)',
              fontWeight: 500,
              lineHeight: 1.5,
            }}
          >
            <strong>{isCorrect ? '✓ Correct!' : '✗ Explanation:'}</strong> {q.explanation}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Results Screen ───────────────────────────────────────────────────────

function ResultsScreen({ score, total, onRetake }) {
  const percentage = Math.round((score / total) * 100)
  const passed = percentage >= 70
  const xpReward = passed ? 100 : 0

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        background: 'var(--c-bg)',
        border: '1px solid var(--c-border)',
        borderRadius: 'var(--r-card)',
        padding: '40px 24px',
        textAlign: 'center',
      }}
    >
      {/* Result icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', damping: 10, delay: 0.1 }}
        style={{
          fontSize: 64,
          marginBottom: 20,
        }}
      >
        {passed ? '🎉' : '📚'}
      </motion.div>

      {/* Score */}
      <div style={{ marginBottom: 12 }}>
        <div style={{
          fontSize: 48,
          fontWeight: 900,
          color: passed ? 'var(--c-success)' : 'var(--c-warning)',
          lineHeight: 1,
          marginBottom: 4,
        }}>
          {percentage}%
        </div>
        <div style={{ fontSize: 16, color: 'var(--c-text)', fontWeight: 600 }}>
          {score} out of {total} correct
        </div>
      </div>

      {/* Status */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: passed ? 'var(--c-success)' : 'var(--c-warning)',
          marginBottom: 24,
          paddingTop: 20,
          borderTop: '1px solid var(--c-border)',
        }}
      >
        {passed ? '✓ Test Passed!' : '✗ Test Failed'}
      </motion.div>

      {/* XP and details */}
      {passed && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--c-success-pale)',
            border: '1px solid var(--c-success)',
            borderRadius: 'var(--r-card)',
            padding: '12px 20px',
            marginBottom: 28,
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--c-success)',
          }}
        >
          <Zap size={16} fill="var(--c-success)" />
          +{xpReward} XP Earned!
        </motion.div>
      )}

      {/* Message */}
      <p style={{
        fontSize: 14,
        color: 'var(--c-text-muted)',
        lineHeight: 1.6,
        marginBottom: 28,
      }}>
        {passed
          ? 'Congratulations! You\'ve mastered the material. You can now move to the next session.'
          : 'You need 70% (21/30) to pass. Review the material and try again.'}
      </p>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onRetake}
          style={{
            padding: '12px 24px',
            background: passed ? 'var(--c-primary)' : 'var(--c-primary)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--r-sm)',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          {passed ? (
            <>
              Continue <ChevronRight size={16} />
            </>
          ) : (
            'Retake Test'
          )}
        </motion.button>
      </div>
    </motion.div>
  )
}

// ─── Main Comprehensive Test Component ────────────────────────────────────

export function ComprehensiveTest({ testId = 'test-1', onComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [phase, setPhase] = useState('questions') // 'questions' or 'results'
  const [startTime] = useState(Date.now())

  const questions = SAMPLE_TEST_QUESTIONS

  const handleAnswer = (isCorrect) => {
    if (isCorrect) setScore(s => s + 1)

    if (currentIndex < questions.length - 1) {
      setTimeout(() => setCurrentIndex(i => i + 1), 1000)
    } else {
      setPhase('results')
    }
  }

  const handleRetake = () => {
    setCurrentIndex(0)
    setScore(0)
    setPhase('questions')
  }

  return (
    <div>
      {/* Header with timer */}
      {phase === 'questions' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24,
            paddingBottom: 16,
            borderBottom: '1px solid var(--c-border)',
          }}
        >
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--c-text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
              Comprehensive Test
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--c-text)' }}>
              30 Questions • All Topics
            </div>
          </div>
          <TestTimer startTime={startTime} />
        </motion.div>
      )}

      {/* Content */}
      <AnimatePresence mode="wait">
        {phase === 'questions' ? (
          <Question
            key={currentIndex}
            q={questions[currentIndex]}
            index={currentIndex}
            total={questions.length}
            onAnswer={handleAnswer}
          />
        ) : (
          <ResultsScreen
            key="results"
            score={score}
            total={questions.length}
            onRetake={handleRetake}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
