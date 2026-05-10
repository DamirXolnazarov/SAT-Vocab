import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { useUserStore } from '../stores/userStore'

// ─── Quest pool ───────────────────────────────────────────────────────────────

const QUEST_POOL = [
  {
    id: 'learn_5',
    icon: '📖',
    title: 'Quick learner',
    desc: 'Practice 5 words today',
    xp: 20,
    type: 'words_practiced',
    target: 5,
  },
  {
    id: 'learn_10',
    icon: '🎯',
    title: 'Daily grind',
    desc: 'Practice 10 words today',
    xp: 35,
    type: 'words_practiced',
    target: 10,
  },
  {
    id: 'streak_3',
    icon: '⚡',
    title: 'On a roll',
    desc: 'Get 3 correct answers in a row',
    xp: 25,
    type: 'streak',
    target: 3,
  },
  {
    id: 'correct_10',
    icon: '✅',
    title: 'Sharp mind',
    desc: 'Answer 10 questions correctly',
    xp: 30,
    type: 'correct_answers',
    target: 10,
  },
  {
    id: 'mastered_1',
    icon: '🏆',
    title: 'Word conquered',
    desc: 'Master a new word today',
    xp: 40,
    type: 'words_mastered',
    target: 1,
  },
  {
    id: 'boss_attempt',
    icon: '👹',
    title: 'Boss challenger',
    desc: 'Attempt a boss battle',
    xp: 30,
    type: 'boss_attempted',
    target: 1,
  },
  {
    id: 'session_complete',
    icon: '🔥',
    title: 'Session done',
    desc: 'Complete a full session',
    xp: 25,
    type: 'sessions_completed',
    target: 1,
  },
  {
    id: 'goal_hit',
    icon: '🎪',
    title: 'Goal crusher',
    desc: 'Hit your daily word goal',
    xp: 50,
    type: 'daily_goal_hit',
    target: 1,
  },
  {
    id: 'search_word',
    icon: '🔍',
    title: 'Word hunter',
    desc: 'Search and add a new word',
    xp: 20,
    type: 'words_added',
    target: 1,
  },
  {
    id: 'struggling_3',
    icon: '💪',
    title: 'Face your fears',
    desc: 'Practice 3 struggling words',
    xp: 35,
    type: 'struggling_practiced',
    target: 3,
  },
]

const BONUS_XP = 75

// ─── Pick 3 quests for today (deterministic by date) ─────────────────────────

function getTodayQuests() {
  const today = new Date().toISOString().split('T')[0]
  const seed  = today.split('-').reduce((a, b) => a + parseInt(b), 0)
  const shuffled = [...QUEST_POOL].sort((a, b) => {
    const hashA = (seed * a.id.length) % QUEST_POOL.length
    const hashB = (seed * b.id.length) % QUEST_POOL.length
    return hashA - hashB
  })
  return shuffled.slice(0, 3)
}

// ─── Quest card ───────────────────────────────────────────────────────────────

function QuestCard({ quest, progress, completed, index }) {
  const pct = Math.min(100, Math.round((progress / quest.target) * 100))

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      style={{
        background: completed ? 'var(--c-success-pale)' : 'var(--c-bg)',
        border: `1.5px solid ${completed ? 'var(--c-success)' : 'var(--c-border)'}`,
        borderRadius: 'var(--r-card)',
        padding: '16px',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Completed shimmer */}
      {completed && (
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: '200%' }}
          transition={{ duration: 1.2, delay: 0.2 }}
          style={{
            position: 'absolute', top: 0, left: 0,
            width: '40%', height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(29,158,117,0.15), transparent)',
            pointerEvents: 'none',
          }}
        />
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        {/* Icon */}
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: completed ? 'rgba(29,158,117,0.15)' : 'var(--c-bg-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22,
          border: completed ? '1px solid rgba(29,158,117,0.3)' : '1px solid var(--c-border)',
        }}>
          {completed ? '✅' : quest.icon}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
            <div style={{
              fontSize: 14, fontWeight: 700,
              color: completed ? 'var(--c-success)' : 'var(--c-text)',
              textDecoration: completed ? 'line-through' : 'none',
              opacity: completed ? 0.7 : 1,
            }}>
              {quest.title}
            </div>
            <div style={{
              fontSize: 12, fontWeight: 700,
              color: completed ? 'var(--c-success)' : 'var(--c-gold)',
              background: completed ? 'rgba(29,158,117,0.1)' : 'var(--c-gold-pale)',
              padding: '2px 8px', borderRadius: 99, flexShrink: 0, marginLeft: 8,
            }}>
              +{quest.xp} XP
            </div>
          </div>

          <div style={{ fontSize: 12, color: 'var(--c-text-muted)', marginBottom: 10 }}>
            {quest.desc}
          </div>

          {/* Progress bar */}
          {!completed && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: 'var(--c-text-muted)' }}>
                  {progress} / {quest.target}
                </span>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--c-primary)' }}>
                  {pct}%
                </span>
              </div>
              <div style={{
                height: 5, background: 'var(--c-border)',
                borderRadius: 3, overflow: 'hidden',
              }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  style={{
                    height: '100%', borderRadius: 3,
                    background: pct >= 100 ? 'var(--c-success)' : 'var(--c-primary)',
                  }}
                />
              </div>
            </div>
          )}

          {completed && (
            <div style={{
              fontSize: 12, fontWeight: 600,
              color: 'var(--c-success)',
            }}>
              ✓ Completed
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Bonus XP claim ───────────────────────────────────────────────────────────

function BonusClaim({ allDone, claimed, onClaim }) {
  return (
    <motion.div
      animate={{
        scale: allDone && !claimed ? [1, 1.02, 1] : 1,
        boxShadow: allDone && !claimed
          ? ['0 0 0 rgba(201,150,58,0)', '0 0 20px rgba(201,150,58,0.3)', '0 0 0 rgba(201,150,58,0)']
          : '0 0 0 rgba(201,150,58,0)',
      }}
      transition={{ repeat: allDone && !claimed ? Infinity : 0, duration: 2 }}
      style={{
        background: claimed
          ? 'var(--c-success-pale)'
          : allDone
          ? 'var(--c-gold-pale)'
          : 'var(--c-bg)',
        border: `1.5px solid ${claimed
          ? 'var(--c-success)'
          : allDone
          ? 'var(--c-gold)'
          : 'var(--c-border)'}`,
        borderRadius: 'var(--r-card)',
        padding: '18px',
        textAlign: 'center',
        marginTop: 16,
      }}
    >
      <div style={{ fontSize: 28, marginBottom: 8 }}>
        {claimed ? '✅' : allDone ? '🎁' : '🔒'}
      </div>
      <div style={{
        fontSize: 15, fontWeight: 700,
        color: claimed ? 'var(--c-success)' : allDone ? 'var(--c-gold)' : 'var(--c-text-muted)',
        marginBottom: 4,
      }}>
        {claimed ? 'Bonus claimed!' : 'All quests bonus'}
      </div>
      <div style={{
        fontSize: 13, color: 'var(--c-text-muted)', marginBottom: allDone && !claimed ? 14 : 0,
      }}>
        {claimed
          ? `+${BONUS_XP} XP added to your total`
          : allDone
          ? `Complete all 3 quests — claim +${BONUS_XP} XP!`
          : `Complete all 3 quests to earn +${BONUS_XP} XP`}
      </div>

      {allDone && !claimed && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onClaim}
          style={{
            padding: '10px 28px', minHeight: 44,
            background: 'var(--c-gold)', color: '#fff',
            border: 'none', borderRadius: 99,
            fontSize: 15, fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(201,150,58,0.35)',
          }}
        >
          Claim +{BONUS_XP} XP 🎉
        </motion.button>
      )}
    </motion.div>
  )
}

// ─── DailyQuests component ────────────────────────────────────────────────────

export function DailyQuests() {
  const { profile, updateProfile } = useAuthStore()
  const { words, sessions }        = useUserStore()

  const [quests,    setQuests]    = useState([])
  const [progress,  setProgress]  = useState({})
  const [completed, setCompleted] = useState({})
  const [claimed,   setClaimed]   = useState(false)
  const [loading,   setLoading]   = useState(true)
  const [claimAnim, setClaimAnim] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    const todayQuests = getTodayQuests()
    setQuests(todayQuests)
    loadQuestState(todayQuests)
  }, [profile?.id])

  const loadQuestState = async (todayQuests) => {
    if (!profile?.id) { setLoading(false); return }
    try {
      // Load from daily_quests table
      const { data } = await supabase
        .from('daily_quests')
        .select('*')
        .eq('user_id', profile.id)
        .eq('date', today)
        .single()

      if (data) {
        setClaimed(data.bonus_xp_claimed || false)
        setCompleted({
          [todayQuests[0]?.id]: data.quest_1_complete,
          [todayQuests[1]?.id]: data.quest_2_complete,
          [todayQuests[2]?.id]: data.quest_3_complete,
        })
      }

      // Calculate real progress from user data
      calculateProgress(todayQuests)
    } catch {
      calculateProgress(todayQuests)
    } finally {
      setLoading(false)
    }
  }

  const calculateProgress = (todayQuests) => {
    // Use words and session data to estimate progress
    const todayWords = words.filter(w => {
      if (!w.last_reviewed_at) return false
      return w.last_reviewed_at.startsWith(today)
    })

    const masteredToday = words.filter(w =>
      w.state === 'mastered' && w.last_reviewed_at?.startsWith(today)
    )

    const prog = {}
    todayQuests.forEach(q => {
      switch (q.type) {
        case 'words_practiced':
          prog[q.id] = todayWords.length
          break
        case 'words_mastered':
          prog[q.id] = masteredToday.length
          break
        case 'words_added':
          prog[q.id] = words.filter(w => w.created_at?.startsWith(today)).length
          break
        case 'sessions_completed':
          prog[q.id] = 0 // updated by session end
          break
        default:
          prog[q.id] = 0
      }
    })
    setProgress(prog)

    // Auto-mark completed
    const comp = {}
    todayQuests.forEach(q => {
      comp[q.id] = (prog[q.id] || 0) >= q.target
    })
    setCompleted(comp)
  }

  const handleClaim = async () => {
    setClaimAnim(true)
    try {
      // Award XP
      const newXP = (profile?.total_xp || 0) + BONUS_XP
      await updateProfile({ total_xp: newXP })

      // Mark claimed in DB
      await supabase
        .from('daily_quests')
        .upsert({
          user_id:          profile.id,
          date:             today,
          quest_1_id:       quests[0]?.id,
          quest_2_id:       quests[1]?.id,
          quest_3_id:       quests[2]?.id,
          quest_1_complete: completed[quests[0]?.id] || false,
          quest_2_complete: completed[quests[1]?.id] || false,
          quest_3_complete: completed[quests[2]?.id] || false,
          bonus_xp_claimed: true,
        })

      setClaimed(true)
    } catch (err) {
      console.error('Claim error:', err)
    } finally {
      setClaimAnim(false)
    }
  }

  const allDone = quests.length > 0 && quests.every(q => completed[q.id])
  const completedCount = quests.filter(q => completed[q.id]).length

  // Time until reset
  const now        = new Date()
  const midnight   = new Date(now)
  midnight.setHours(24, 0, 0, 0)
  const hoursLeft  = Math.floor((midnight - now) / 1000 / 3600)
  const minsLeft   = Math.floor(((midnight - now) / 1000 / 60) % 60)

  if (loading) {
    return (
      <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--c-text-muted)' }}>
        Loading quests…
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--c-text)', marginBottom: 2 }}>
              Daily Quests
            </div>
            <div style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>
              Resets in {hoursLeft}h {minsLeft}m
            </div>
          </div>
          <div style={{
            textAlign: 'right',
            background: completedCount === 3 ? 'var(--c-success-pale)' : 'var(--c-primary-pale)',
            border: `1px solid ${completedCount === 3 ? 'var(--c-success)' : 'var(--c-primary)'}`,
            borderRadius: 99, padding: '4px 14px',
          }}>
            <div style={{
              fontSize: 16, fontWeight: 800,
              color: completedCount === 3 ? 'var(--c-success)' : 'var(--c-primary)',
            }}>
              {completedCount}/3
            </div>
            <div style={{ fontSize: 10, color: 'var(--c-text-muted)' }}>done</div>
          </div>
        </div>
      </div>

      {/* Quest cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {quests.map((quest, i) => (
          <QuestCard
            key={quest.id}
            quest={quest}
            progress={progress[quest.id] || 0}
            completed={completed[quest.id] || false}
            index={i}
          />
        ))}
      </div>

      {/* Bonus claim */}
      <BonusClaim
        allDone={allDone}
        claimed={claimed}
        onClaim={handleClaim}
      />

      {/* XP float animation */}
      <AnimatePresence>
        {claimAnim && (
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 0, y: -60 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            style={{
              position: 'fixed', top: 80, right: 24, zIndex: 200,
              fontSize: 18, fontWeight: 800, color: 'var(--c-gold)',
              pointerEvents: 'none',
            }}
          >
            +{BONUS_XP} XP ⚡
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}