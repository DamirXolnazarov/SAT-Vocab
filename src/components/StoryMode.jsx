import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, BookOpen, Zap, Check, X } from 'lucide-react'
import { supabase } from '../lib/supabase'

/**
 * StoryMode Component
 *
 * Displays every 5th session as a story mode:
 * - Reads a narrative passage
 * - Curriculum words + user-entered words are highlighted
 * - Comprehension questions follow
 * - Students can hover to see definitions
 */

// Sample story data (would be fetched from DB in production)
const SAMPLE_STORIES = {
  5: {
    title: 'The Ambitious Entrepreneur',
    story: `Sarah was a perspicacious young entrepreneur who recognized an opportunity where others saw only obstacles. 
    Her nascent startup was built on a premise that seemed aberrant to most investors: people would pay for 
    completely transparent business practices. Though her colleagues called her approach quixotic, Sarah remained 
    steadfast. She was not sanguine about every deal, but her acrimonious negotiations with suppliers slowly 
    turned into productive partnerships. As her company grew, even the most obstinate critics began to see 
    the sagacity in her vision.`,
    words: [
      { word: 'perspicacious', def: 'Having keen insight or understanding' },
      { word: 'nascent', def: 'Just beginning to develop; emerging' },
      { word: 'aberrant', def: 'Departing from usual or accepted standards' },
      { word: 'quixotic', def: 'Exceedingly idealistic; unrealistic' },
      { word: 'sanguine', def: 'Optimistic; positive' },
      { word: 'acrimonious', def: 'Bitter; harsh in tone' },
      { word: 'obstinate', def: 'Stubbornly adhering to an opinion' },
      { word: 'sagacity', def: 'Good judgment; wisdom' },
    ],
    questions: [
      {
        question: 'What does "perspicacious" mean in the context of Sarah?',
        options: [
          'She had sharp insight and understanding',
          'She was very lucky',
          'She was stubborn about her ideas',
          'She copied others ideas',
        ],
        correct: 0,
      },
      {
        question: 'Why did critics call her approach "quixotic"?',
        options: [
          'Because it was based on practical experience',
          'Because it seemed unrealistic and overly idealistic',
          'Because transparency had worked before',
          'Because her colleagues agreed with her',
        ],
        correct: 1,
      },
      {
        question: 'How did Sarahs negotiations eventually change?',
        options: [
          'They became more bitter and angry',
          'They stopped happening',
          'Her harsh negotiations turned into productive partnerships',
          'She gave up negotiating altogether',
        ],
        correct: 2,
      },
    ],
  },
}

function StoryText({ storyData }) {
  const wordMap = Object.fromEntries(storyData.words.map(w => [w.word.toLowerCase(), w.def]))

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      style={{
        background: 'var(--c-bg)',
        border: '1px solid var(--c-border)',
        borderRadius: 'var(--r-card)',
        padding: '24px',
        marginBottom: 20,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <BookOpen size={18} color="var(--c-primary)" />
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--c-text)', margin: 0 }}>
          {storyData.title}
        </h2>
      </div>

      <div style={{
        fontSize: 16,
        lineHeight: 1.8,
        color: 'var(--c-text)',
        whiteSpace: 'pre-wrap',
      }}>
        {storyData.story.split(/\b/).map((part, idx) => {
          const word = part.toLowerCase().replace(/[.,!?;:\-]/g, '')
          const def = wordMap[word]

          if (def) {
            return (
              <motion.span
                key={idx}
                whileHover={{ backgroundColor: 'var(--c-primary-pale)', scale: 1.02 }}
                style={{
                  cursor: 'help',
                  color: 'var(--c-primary)',
                  fontWeight: 600,
                  borderRadius: 4,
                  padding: '2px 4px',
                  position: 'relative',
                  transition: 'all 0.2s ease',
                }}
                title={def}
              >
                {part}
              </motion.span>
            )
          }

          return <span key={idx}>{part}</span>
        })}
      </div>

      <div style={{
        marginTop: 16,
        padding: '12px 14px',
        background: 'var(--c-primary-pale)',
        border: '1px solid rgba(139,26,46,0.2)',
        borderRadius: 'var(--r-sm)',
        fontSize: 12,
        color: 'var(--c-primary)',
        fontWeight: 500,
      }}>
        💡 Hover over highlighted words to see definitions
      </div>
    </motion.div>
  )
}

function ComprehensionQuestion({ question, index, total, onAnswer }) {
  const [selected, setSelected] = useState(null)
  const [answered, setAnswered] = useState(false)

  const handleSelect = (optionIndex) => {
    setSelected(optionIndex)
    setAnswered(true)
    setTimeout(() => {
      onAnswer(optionIndex === question.correct)
    }, 800)
  }

  const isCorrect = selected === question.correct

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      style={{
        background: 'var(--c-bg)',
        border: '1px solid var(--c-border)',
        borderRadius: 'var(--r-card)',
        padding: '20px',
        marginBottom: 16,
      }}
    >
      {/* Question number */}
      <div style={{
        fontSize: 11,
        fontWeight: 700,
        color: 'var(--c-primary)',
        textTransform: 'uppercase',
        marginBottom: 10,
        letterSpacing: '0.05em',
      }}>
        Question {index + 1} of {total}
      </div>

      {/* Question text */}
      <h3 style={{
        fontSize: 16,
        fontWeight: 700,
        color: 'var(--c-text)',
        marginBottom: 16,
        lineHeight: 1.5,
      }}>
        {question.question}
      </h3>

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {question.options.map((option, i) => {
          const isSelected = selected === i
          const isCorrectOption = i === question.correct
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
          }

          return (
            <motion.button
              key={i}
              whileTap={!answered ? { scale: 0.98 } : {}}
              onClick={() => !answered && handleSelect(i)}
              disabled={answered}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '12px 14px',
                background: bgColor,
                border: `2px solid ${borderColor}`,
                borderRadius: 'var(--r-sm)',
                cursor: answered ? 'default' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: answered && !isSelected && !isCorrectOption ? 0.5 : 1,
              }}
            >
              {/* Letter badge */}
              <div style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: textColor,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                flexShrink: 0,
                fontSize: 12,
              }}>
                {['A', 'B', 'C', 'D'][i]}
              </div>

              {/* Option text */}
              <div style={{ flex: 1, textAlign: 'left', fontSize: 14, color: textColor, fontWeight: 500 }}>
                {option}
              </div>

              {/* Result icon */}
              {answered && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  style={{ flexShrink: 0, marginTop: 2 }}
                >
                  {isCorrectOption ? (
                    <Check size={20} color="var(--c-success)" strokeWidth={3} />
                  ) : isSelected && !isCorrect ? (
                    <X size={20} color="var(--c-danger)" strokeWidth={3} />
                  ) : null}
                </motion.div>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Feedback */}
      <AnimatePresence>
        {answered && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              marginTop: 14,
              padding: '12px 14px',
              background: isCorrect ? 'var(--c-success-pale)' : 'var(--c-danger-pale)',
              border: `1px solid ${isCorrect ? 'var(--c-success)' : 'var(--c-danger)'}`,
              borderRadius: 'var(--r-sm)',
              fontSize: 13,
              color: isCorrect ? 'var(--c-success)' : 'var(--c-danger)',
              fontWeight: 600,
            }}
          >
            {isCorrect ? '✓ Correct! Great job!' : '✗ Incorrect. Keep learning!'}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Main Story Mode Component ────────────────────────────────────────────────

export function StoryMode({ storyId = 5, onComplete }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [phase, setPhase] = useState('story') // 'story' or 'questions'
  const [testResults, setTestResults] = useState([])

  const storyData = SAMPLE_STORIES[storyId]
  if (!storyData) {
    return <div>Story not found</div>
  }

  const handleAnswer = (isCorrect) => {
    if (isCorrect) setScore(s => s + 1)

    const newResults = [...testResults, isCorrect]
    setTestResults(newResults)

    if (currentQuestionIndex < storyData.questions.length - 1) {
      setTimeout(() => setCurrentQuestionIndex(i => i + 1), 1000)
    } else {
      setTimeout(() => {
        const finalScore = newResults.filter(Boolean).length
        const percentage = Math.round((finalScore / storyData.questions.length) * 100)

        if (onComplete) {
          onComplete({
            score: finalScore,
            total: storyData.questions.length,
            percentage,
          })
        }
      }, 1000)
    }
  }

  if (phase === 'story') {
    return (
      <div>
        <StoryText storyData={storyData} />

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setPhase('questions')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            width: '100%',
            padding: '14px 20px',
            background: 'var(--c-primary)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--r-card)',
            fontSize: 16,
            fontWeight: 700,
            cursor: 'pointer',
            justifyContent: 'center',
          }}
        >
          Continue to Questions
          <ChevronRight size={18} />
        </motion.button>
      </div>
    )
  }

  return (
    <div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ marginBottom: 16 }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 16,
        }}>
          <Zap size={18} color="var(--c-primary)" />
          <h2 style={{
            fontSize: 20,
            fontWeight: 800,
            color: 'var(--c-text)',
            margin: 0,
          }}>
            Story Comprehension
          </h2>
        </div>

        {/* Progress bar */}
        <div style={{
          height: 6,
          background: 'var(--c-border)',
          borderRadius: 3,
          overflow: 'hidden',
        }}>
          <motion.div
            animate={{
              width: `${((currentQuestionIndex + 1) / storyData.questions.length) * 100}%`,
            }}
            transition={{ duration: 0.4 }}
            style={{
              height: '100%',
              background: 'var(--c-primary)',
              borderRadius: 3,
            }}
          />
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        <ComprehensionQuestion
          key={currentQuestionIndex}
          question={storyData.questions[currentQuestionIndex]}
          index={currentQuestionIndex}
          total={storyData.questions.length}
          onAnswer={handleAnswer}
        />
      </AnimatePresence>
    </div>
  )
}
