import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useAuthStore = create((set, get) => ({
  user:    null,
  profile: null,
  loading: true,

  // ─── Initialize ─────────────────────────────────────────────────
  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession()

    if (session?.user) {
      set({ user: session.user })
      await get().fetchProfile(session.user.id)
    }

    set({ loading: false })

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        set({ user: session.user })
        await get().fetchProfile(session.user.id)
      } else {
        set({ user: null, profile: null })
      }
    })
  },

  // ─── Fetch profile ───────────────────────────────────────────────
  fetchProfile: async (userId) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (!error && data) set({ profile: data })
  },

  // ─── Sign up ─────────────────────────────────────────────────────
  signUp: async ({ email, password, username }) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error

    // Update auto-created profile — level null marks "needs assessment"
    const { error: profileError } = await supabase
      .from('users')
      .update({
        username,
        email,
        level:                null,
        onboarding_complete:  false,
      })
      .eq('id', data.user.id)

    if (profileError) throw profileError

    set({ user: data.user })
    await get().fetchProfile(data.user.id)
    return data
  },

  // ─── Sign in ─────────────────────────────────────────────────────
  signIn: async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email, password,
    })
    if (error) throw error
    set({ user: data.user })
    await get().fetchProfile(data.user.id)
    return data
  },

  // ─── Sign out ────────────────────────────────────────────────────
  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, profile: null })
  },

  // ─── Update profile ──────────────────────────────────────────────
  updateProfile: async (updates) => {
    const { user } = get()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (error) throw error
    set({ profile: data })
    return data
  },

  // ─── Mark onboarding complete ─────────────────────────────────────
  // Called after journey animation finishes — user is fully set up
  completeOnboarding: async () => {
    const { user } = get()
    if (!user) return
    await supabase
      .from('users')
      .update({ onboarding_complete: true })
      .eq('id', user.id)
    set(state => ({
      profile: state.profile
        ? { ...state.profile, onboarding_complete: true }
        : state.profile,
    }))
  },
}))