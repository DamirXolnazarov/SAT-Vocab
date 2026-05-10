import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useUserStore = create((set, get) => ({
  words: [],
  wordsLoading: false,
  currentSession: null,

  // ─── Words ────────────────────────────────────────────────────────

  fetchWords: async (userId) => {
    set({ wordsLoading: true })
    const { data, error } = await supabase
      .from('words')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (!error) set({ words: data || [] })
    set({ wordsLoading: false })
  },

  addWord: async (wordData) => {
    const { data, error } = await supabase
      .from('words')
      .insert(wordData)
      .select()
      .single()
    if (error) throw error
    set(state => ({ words: [data, ...state.words] }))
    return data
  },

  updateWord: async (wordId, updates) => {
    const { data, error } = await supabase
      .from('words')
      .update(updates)
      .eq('id', wordId)
      .select()
      .single()
    if (error) throw error
    set(state => ({
      words: state.words.map(w => w.id === wordId ? data : w),
    }))
    return data
  },

  deleteWord: async (wordId) => {
    const { error } = await supabase
      .from('words')
      .delete()
      .eq('id', wordId)
    if (error) throw error
    set(state => ({ words: state.words.filter(w => w.id !== wordId) }))
  },

  // ─── Mastery & spaced repetition ─────────────────────────────────

  recordAnswer: async (word, isCorrect) => {
    const delta    = isCorrect ? 20 : -15
    const newScore = Math.min(100, Math.max(0, (word.mastery_score || 0) + delta))

    const timesCorrect = (word.times_correct || 0) + (isCorrect ? 1 : 0)
    const timesSeen    = (word.times_seen || 0) + 1
    const correctRate  = timesCorrect / timesSeen

    // Determine word state
    let state = word.state
    if (newScore >= 80) {
      state = 'mastered'
    } else if (correctRate < 0.5 && timesSeen >= 3) {
      state = 'struggling'
    } else if (timesSeen >= 1) {
      state = 'learning'
    }

    // Spaced repetition: days until next review
    const intervals = { mastered: 7, learning: 4, struggling: 1, new: 2 }
    const days = intervals[state] || 1
    const nextReview = new Date()
    nextReview.setDate(nextReview.getDate() + days)

    return get().updateWord(word.id, {
      mastery_score:    newScore,
      state,
      times_seen:       timesSeen,
      times_correct:    timesCorrect,
      last_reviewed_at: new Date().toISOString(),
      next_review_at:   nextReview.toISOString(),
    })
  },

  // ─── Session queue ────────────────────────────────────────────────
  // 3 new words → weighted review pool (struggling 3×) → mastered reviews due

  buildSessionQueue: (count = 10) => {
    const words = get().words
    const now   = new Date()

    const newWords = words
      .filter(w => w.state === 'new')
      .slice(0, 3)

    const dueReview = words.filter(w =>
      w.state !== 'new' &&
      w.state !== 'mastered' &&
      (!w.next_review_at || new Date(w.next_review_at) <= now)
    )

    const struggling = words.filter(w => w.state === 'struggling')

    const masteredDue = words.filter(w =>
      w.state === 'mastered' &&
      w.next_review_at &&
      new Date(w.next_review_at) <= now
    )

    // Struggling appears 3× more often via repetition in pool
    const pool = [
      ...dueReview,
      ...struggling,
      ...struggling,
      ...masteredDue,
    ].sort(() => Math.random() - 0.5)

    // Deduplicate
    const seen   = new Set()
    const deduped = []
    for (const w of pool) {
      if (!seen.has(w.id)) { seen.add(w.id); deduped.push(w) }
    }

    return [...newWords, ...deduped].slice(0, count)
  },

  // ─── Sessions ─────────────────────────────────────────────────────

  startSession: async (userId) => {
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        user_id:      userId,
        started_at:   new Date().toISOString(),
        session_hour: new Date().getHours(),
      })
      .select()
      .single()
    if (error) throw error
    set({
      currentSession: {
        ...data,
        xp_earned:       0,
        words_practiced: [],
        hearts:          5,
      },
    })
    return data
  },

  addXPToSession: (amount) => {
    set(state => ({
      currentSession: state.currentSession
        ? { ...state.currentSession, xp_earned: (state.currentSession.xp_earned || 0) + amount }
        : null,
    }))
  },

  loseHeart: () => {
    set(state => ({
      currentSession: state.currentSession
        ? { ...state.currentSession, hearts: Math.max(0, (state.currentSession.hearts || 5) - 1) }
        : null,
    }))
  },

  endSession: async (summary) => {
    const { currentSession } = get()
    if (!currentSession) return

    const { data, error } = await supabase
      .from('sessions')
      .update({
        ended_at:         new Date().toISOString(),
        xp_earned:        summary.xp_earned,
        words_practiced:  summary.words_practiced,
        hearts_remaining: summary.hearts_remaining,
        daily_goal_hit:   summary.daily_goal_hit,
      })
      .eq('id', currentSession.id)
      .select()
      .single()

    if (error) throw error
    set({ currentSession: null })
    return data
  },

  // ─── XP & level ───────────────────────────────────────────────────

  awardXP: async (userId, amount) => {
    const { data: user } = await supabase
      .from('users')
      .select('total_xp')
      .eq('id', userId)
      .single()
    if (!user) return

    const newXP  = (user.total_xp || 0) + amount
    const level  = getLevel(newXP)

    await supabase
      .from('users')
      .update({ total_xp: newXP, level: level.label })
      .eq('id', userId)
  },

  // ─── Streak ───────────────────────────────────────────────────────

  updateStreak: async (userId) => {
    const { data: user } = await supabase
      .from('users')
      .select('current_streak, longest_streak, last_active_date, streak_freeze_available')
      .eq('id', userId)
      .single()
    if (!user) return

    const today      = new Date().toDateString()
    const lastDate   = user.last_active_date
      ? new Date(user.last_active_date).toDateString()
      : null

    // Already updated today
    if (lastDate === today) return

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const wasYesterday = lastDate === yesterday.toDateString()

    // Missed a day — use streak freeze if available
    if (!wasYesterday && lastDate !== today && user.streak_freeze_available) {
      await supabase
        .from('users')
        .update({
          last_active_date:        new Date().toISOString(),
          streak_freeze_available: false,
        })
        .eq('id', userId)
      return
    }

    const newStreak     = wasYesterday ? (user.current_streak || 0) + 1 : 1
    const longestStreak = Math.max(newStreak, user.longest_streak || 0)

    await supabase
      .from('users')
      .update({
        current_streak:   newStreak,
        longest_streak:   longestStreak,
        last_active_date: new Date().toISOString(),
      })
      .eq('id', userId)
  },
}))

// ─── Level helpers (exported for use in components) ───────────────────────────

const LEVELS = [
  { label: 'Beginner',     min: 0,    max: 499        },
  { label: 'Learner',      min: 500,  max: 1499       },
  { label: 'Intermediate', min: 1500, max: 3499       },
  { label: 'Advanced',     min: 3500, max: 6999       },
  { label: 'SAT Master',   min: 7000, max: Infinity   },
]

export function getLevel(xp) {
  return LEVELS.find(l => xp >= l.min && xp <= l.max) || LEVELS[0]
}

export function getLevelProgress(xp) {
  const level = getLevel(xp)
  if (level.max === Infinity) return 100
  return Math.round(((xp - level.min) / (level.max - level.min)) * 100)
}