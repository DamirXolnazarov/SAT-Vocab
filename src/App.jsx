import { useEffect } from 'react'
import {
  BrowserRouter, Routes, Route,
  Navigate, useNavigate, useLocation,
} from 'react-router-dom'
import { useAuthStore } from './stores/authStore'

// Layout
import { AppLayout } from './components/layout/AppLayout'

// Public
import { Landing }    from './pages/Landing'
import { Onboarding } from './pages/onboarding/Onboarding'

// Onboarding flow
import { LevelAssessment }  from './pages/LevelAssessment'
import { DailyGoalPicker }  from './components/DailyGoalPicker'
import { JourneyAnimation } from './components/JourneyAnimation'

// Protected pages
import { Home }          from './pages/Home'
import { Learn }         from './pages/Learn'
import { Stats }         from './pages/Stats'
import { Compete }       from './pages/Compete'
import { Profile }       from './pages/Profile'
import { WordDetail }    from './pages/WordDetail'
import { WordOfDay }     from './pages/WordOfDay'
import { Notifications } from './pages/Notifications'

// ─── Loading screen ───────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--c-bg-off)', gap: 20,
    }}>
      <div style={{
        width: 52, height: 52,
        background: 'var(--c-primary)', borderRadius: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 20px rgba(139,26,46,0.3)',
      }}>
        <span style={{
          color: '#fff', fontWeight: 900, fontSize: 26,
          fontFamily: 'Georgia, serif',
        }}>V</span>
      </div>
      <div style={{
        width: 24, height: 24,
        border: '2.5px solid var(--c-border)',
        borderTopColor: 'var(--c-primary)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

// ─── Smart redirect ───────────────────────────────────────────────────────────
// Decides where to send user based on their state

function SmartRedirect() {
  const { user, profile, loading } = useAuthStore()

  if (loading) return <LoadingScreen />

  // Not logged in → landing
  if (!user) return <Navigate to="/" replace />

  // Profile not loaded yet → wait
  if (!profile) return <LoadingScreen />

  // New user — needs to complete onboarding flow
  if (!profile.onboarding_complete) {
    // No level set → start with assessment
    if (!profile.level) {
      return <Navigate to="/assessment" replace />
    }
    // Has level but no daily goal set → go to goal picker
    if (!profile.daily_goal || !profile.daily_minutes) {
      return <Navigate to="/goal" replace />
    }
    // Has everything → go to journey animation
    return <Navigate to="/journey" replace />
  }

  // Returning user → home
  return <Navigate to="/home" replace />
}

// ─── Auth gate ────────────────────────────────────────────────────────────────

function AuthGate({ children }) {
  const { user, loading } = useAuthStore()
  if (loading) return <LoadingScreen />
  if (!user)   return <Navigate to="/" replace />
  return children
}

// ─── Onboarding complete gate ─────────────────────────────────────────────────
// Prevents accessing app before onboarding is done

function OnboardingCompleteGate({ children }) {
  const { user, profile, loading } = useAuthStore()
  if (loading)  return <LoadingScreen />
  if (!user)    return <Navigate to="/" replace />
  if (!profile) return <LoadingScreen />

  if (!profile.onboarding_complete) {
    return <Navigate to="/redirect" replace />
  }
  return children
}

// ─── Assessment page ──────────────────────────────────────────────────────────

function AssessmentPage() {
  const navigate            = useNavigate()
  const { profile }         = useAuthStore()

  // Already has level — skip to goal
  useEffect(() => {
    if (profile?.level) navigate('/goal', { replace: true })
  }, [profile?.level])

  return (
    <LevelAssessment
      onComplete={() => navigate('/goal', { replace: true })}
    />
  )
}

// ─── Daily goal page ──────────────────────────────────────────────────────────

function GoalPage() {
  const navigate        = useNavigate()
  const { updateProfile } = useAuthStore()

  const handleSelect = async (minutes) => {
    // minutes = 5 | 10 | 15 | 20 | 30
    // words per session = same number as minutes
    try {
      await updateProfile({
        daily_goal:    minutes,   // words per session
        daily_minutes: minutes,   // minutes per day
      })
    } catch (err) {
      console.warn('Goal save failed:', err.message)
    }
    navigate('/journey', { replace: true })
  }

  return <DailyGoalPicker onSelect={handleSelect} />
}

// ─── Journey animation page ───────────────────────────────────────────────────

function JourneyPage() {
  const navigate                    = useNavigate()
  const { profile, completeOnboarding } = useAuthStore()

  const level      = profile?.level        || 'Beginner'
  const dailyGoal  = profile?.daily_goal   || 10
  const totalUnits = Math.ceil(1380 / dailyGoal)

  const handleComplete = async () => {
    // Mark onboarding done — next login goes straight to /home
    await completeOnboarding()
    navigate('/home', { replace: true })
  }

  return (
    <JourneyAnimation
      level={level}
      dailyGoal={dailyGoal}
      totalUnits={totalUnits}
      onAnimationComplete={handleComplete}
    />
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const { initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <BrowserRouter>
      <Routes>

        {/* ── Public ── */}
        <Route path="/"           element={<Landing />} />
        <Route path="/onboarding" element={<Onboarding />} />

        {/* ── Smart redirect — figures out where new/returning user goes ── */}
        <Route path="/redirect" element={<SmartRedirect />} />

        {/* ── Onboarding flow (auth required, no app shell) ── */}
        <Route path="/assessment" element={<AuthGate><AssessmentPage /></AuthGate>} />
        <Route path="/goal"       element={<AuthGate><GoalPage /></AuthGate>} />
        <Route path="/journey"    element={<AuthGate><JourneyPage /></AuthGate>} />

        {/* ── Protected app (onboarding must be complete) ── */}
        <Route element={
          <OnboardingCompleteGate>
            <AppLayout />
          </OnboardingCompleteGate>
        }>
          <Route path="/home"          element={<Home />} />
          <Route path="/learn"         element={<Learn />} />
          <Route path="/stats"         element={<Stats />} />
          <Route path="/compete"       element={<Compete />} />
          <Route path="/profile"       element={<Profile />} />
          <Route path="/word"          element={<WordDetail />} />
          <Route path="/word-of-day"   element={<WordOfDay />} />
          <Route path="/notifications" element={<Notifications />} />
        </Route>

        {/* ── Fallback ── */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  )
}