import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useUserStore = create((set, get) => ({
  words:          [],
  wordsLoading:   false,
  currentSession: null,

  // ─── Personal word list ───────────────────────────────────────────

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

  // ─── Curriculum session engine ────────────────────────────────────
  // Fetches words for a given unit from word_bank table.
  // Falls back to personal word list if unit has no words.

  buildCurriculumSession: async (userId, dailyGoal = 10) => {
    try {
      // 1. Find the user's current active unit
      const { data: activeUnit } = await supabase
        .from('user_units')
        .select('*, units(*)')
        .eq('user_id', userId)
        .eq('state', 'active')
        .order('unit_number', { ascending: true })
        .limit(1)
        .single()

      // 2. If no active unit exists, find the first unit and activate it
      let unitToUse = activeUnit

      if (!unitToUse) {
        // Get the very first unit
        const { data: firstUnit } = await supabase
          .from('units')
          .select('*')
          .order('unit_number', { ascending: true })
          .limit(1)
          .single()

        if (!firstUnit) {
          // No units at all — fall back to personal words
          return get().buildSessionQueueFromPersonal(dailyGoal)
        }

        // Create a user_units row for this unit, mark it active
        const { data: newUserUnit } = await supabase
          .from('user_units')
          .insert({
            user_id:     userId,
            unit_id:     firstUnit.id,
            unit_number: firstUnit.unit_number,
            state:       'active',
            started_at:  new Date().toISOString(),
          })
          .select('*, units(*)')
          .single()

        unitToUse = newUserUnit
      }

      // 3. Get the actual unit record
      const unit = unitToUse?.units || unitToUse

      if (!unit?.word_ids || unit.word_ids.length === 0) {
        return get().buildSessionQueueFromPersonal(dailyGoal)
      }

      // 4. Fetch word details from word_bank for this unit's word_ids
      const { data: bankWords } = await supabase
        .from('word_bank')
        .select('*')
        .in('id', unit.word_ids)

      if (!bankWords || bankWords.length === 0) {
        return get().buildSessionQueueFromPersonal(dailyGoal)
      }

      // 5. Limit to daily goal count
      const sessionWords = bankWords.slice(0, dailyGoal)

      // 6. Also inject user's personal words that are due (if any)
      //    Personal words get added at the end, up to 2 extra slots
      const { words } = get()
      const now = new Date()
      const personalDue = words
        .filter(w =>
          w.state !== 'mastered' &&
          (!w.next_review_at || new Date(w.next_review_at) <= now)
        )
        .slice(0, 2)
        .map(w => ({ ...w, _isPersonal: true }))

      return {
        words:      [...sessionWords, ...personalDue],
        unit,
        userUnitId: unitToUse?.id,
        isStory:    unit.is_story_session || false,
        isTest:     unit.is_test_session  || false,
        xpReward:   unit.xp_reward || 50,
      }

    } catch (err) {
      console.error('buildCurriculumSession error:', err)
      return get().buildSessionQueueFromPersonal(dailyGoal)
    }
  },

  // ─── Complete a unit and unlock the next one ──────────────────────

  completeUnit: async (userId, userUnitId, unitId) => {
    try {
      // 1. Mark current unit as completed
      await supabase
        .from('user_units')
        .update({
          state:        'complete',
          completed_at: new Date().toISOString(),
        })
        .eq('id', userUnitId)

      // 2. Find the next unit
      const { data: currentUnit } = await supabase
        .from('units')
        .select('unit_number')
        .eq('id', unitId)
        .single()

      if (!currentUnit) return

      const { data: nextUnit } = await supabase
        .from('units')
        .select('*')
        .eq('unit_number', currentUnit.unit_number + 1)
        .single()

      if (!nextUnit) return // No more units — finished!

      // 3. Create or update user_units for next unit → active
      const { data: existingNext } = await supabase
        .from('user_units')
        .select('id')
        .eq('user_id', userId)
        .eq('unit_id', nextUnit.id)
        .single()

      if (existingNext) {
        await supabase
          .from('user_units')
          .update({ state: 'active', started_at: new Date().toISOString() })
          .eq('id', existingNext.id)
      } else {
        await supabase
          .from('user_units')
          .insert({
            user_id:     userId,
            unit_id:     nextUnit.id,
            unit_number: nextUnit.unit_number,
            state:       'active',
            started_at:  new Date().toISOString(),
          })
      }
    } catch (err) {
      console.error('completeUnit error:', err)
    }
  },

  // ─── Fallback: session from personal word list ────────────────────

  buildSessionQueueFromPersonal: (count = 10) => {
    const words = get().words
    const now   = new Date()

    const newWords = words.filter(w => w.state === 'new').slice(0, 3)

    const dueReview = words.filter(w =>
      w.state !== 'new' &&
      w.state !== 'mastered' &&
      (!w.next_review_at || new Date(w.next_review_at) <= now)
    )

    const struggling  = words.filter(w => w.state === 'struggling')
    const masteredDue = words.filter(w =>
      w.state === 'mastered' &&
      w.next_review_at &&
      new Date(w.next_review_at) <= now
    )

    const pool = [
      ...dueReview,
      ...struggling,
      ...struggling, // struggling appears 2x more
      ...masteredDue,
    ].sort(() => Math.random() - 0.5)

    const seen    = new Set()
    const deduped = []
    for (const w of pool) {
      if (!seen.has(w.id)) { seen.add(w.id); deduped.push(w) }
    }

    return {
      words:      [...newWords, ...deduped].slice(0, count),
      unit:       null,
      userUnitId: null,
      isStory:    false,
      isTest:     false,
      xpReward:   50,
    }
  },

  // ─── Mastery tracking (works for both curriculum + personal words) ─

  recordAnswer: async (word, isCorrect) => {
    // For curriculum words (from word_bank), we track in a local
    // session state only — they don't have a row in the user's
    // personal 'words' table unless they added them manually.
    // For personal words (_isPersonal flag), we update the DB.
    if (!word._isPersonal && !word.user_id) return word

    const delta    = isCorrect ? 20 : -15
    const newScore = Math.min(100, Math.max(0, (word.mastery_score || 0) + delta))
    const timesCorrect = (word.times_correct || 0) + (isCorrect ? 1 : 0)
    const timesSeen    = (word.times_seen    || 0) + 1
    const correctRate  = timesCorrect / timesSeen

    let state = word.state || 'new'
    if (newScore >= 80)                            state = 'mastered'
    else if (correctRate < 0.5 && timesSeen >= 3) state = 'struggling'
    else if (timesSeen >= 1)                       state = 'learning'

    const intervals = { mastered: 7, learning: 4, struggling: 1, new: 2 }
    const nextReview = new Date()
    nextReview.setDate(nextReview.getDate() + (intervals[state] || 1))

    return get().updateWord(word.id, {
      mastery_score:    newScore,
      state,
      times_seen:       timesSeen,
      times_correct:    timesCorrect,
      last_reviewed_at: new Date().toISOString(),
      next_review_at:   nextReview.toISOString(),
    })
  },

  // ─── XP & streak ─────────────────────────────────────────────────

  awardXP: async (userId, amount) => {
    const { data: user } = await supabase
      .from('users')
      .select('total_xp')
      .eq('id', userId)
      .single()
    if (!user) return

    const newXP = (user.total_xp || 0) + amount
    const level = getLevel(newXP)

    await supabase
      .from('users')
      .update({ total_xp: newXP, level: level.label })
      .eq('id', userId)
  },

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

    if (lastDate === today) return

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const wasYesterday = lastDate === yesterday.toDateString()

    if (!wasYesterday && lastDate !== today && user.streak_freeze_available) {
      await supabase
        .from('users')
        .update({ last_active_date: new Date().toISOString(), streak_freeze_available: false })
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

// ─── Level helpers ────────────────────────────────────────────────────────────

const LEVELS = [
  { label: 'Beginner',     min: 0,    max: 499      },
  { label: 'Learner',      min: 500,  max: 1499     },
  { label: 'Intermediate', min: 1500, max: 3499     },
  { label: 'Advanced',     min: 3500, max: 6999     },
  { label: 'SAT Master',   min: 7000, max: Infinity },
]

export function getLevel(xp) {
  return LEVELS.find(l => xp >= l.min && xp <= l.max) || LEVELS[0]
}

export function getLevelProgress(xp) {
  const level = getLevel(xp)
  if (level.max === Infinity) return 100
  return Math.round(((xp - level.min) / (level.max - level.min)) * 100)
}
