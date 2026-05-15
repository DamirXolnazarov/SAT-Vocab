import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'

// Layout
import { AppLayout } from './components/layout/AppLayout'

// Public
import { Landing }         from './pages/Landing'
import { Onboarding }      from './pages/onboarding/Onboarding'
import { LevelAssessment } from './pages/LevelAssessment'

// Onboarding flow (post-signup)
import { DailyGoalPicker }  from './components/DailyGoalPicker'
import { JourneyAnimation } from './components/JourneyAnimation'

// Protected pages
import { Roadmap }       from './pages/Roadmap'
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
        <span style={{ color: '#fff', fontWeight: 900, fontSize: 26, fontFamily: 'Georgia, serif' }}>
          V
        </span>
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

// ─── Auth gate ────────────────────────────────────────────────────────────────

function AuthGate({ children }) {
  const { user, loading } = useAuthStore()
  if (loading) return <LoadingScreen />
  if (!user)   return <Navigate to="/" replace />
  return children
}

// ─── Assessment page ──────────────────────────────────────────────────────────
// After assessment completes → go to daily goal picker

function AssessmentPage() {
  const navigate = useNavigate()
  return (
    <LevelAssessment
      onComplete={() => navigate('/goal', { replace: true })}
    />
  )
}

// ─── Daily goal page ──────────────────────────────────────────────────────────
// After goal picked → go to journey animation

function GoalPage() {
  const navigate                   = useNavigate()
  const { updateProfile }          = useAuthStore()

  const handleSelect = async (minutes) => {
    try {
      await updateProfile({ daily_goal: minutes })
    } catch (err) {
      console.warn('Goal save failed:', err.message)
    }
    navigate('/journey', { replace: true })
  }

  return <DailyGoalPicker onSelect={handleSelect} />
}

// ─── Journey animation page ───────────────────────────────────────────────────
// Shows the "arranging your journey" animation → then goes to roadmap

function JourneyPage() {
  const navigate        = useNavigate()
  const { profile }     = useAuthStore()

  const level      = profile?.level || 'Beginner'
  const dailyGoal  = profile?.daily_goal || 10

  // Total sessions = total words / words per session
  // 1,380 words / daily_goal = total sessions
  const totalUnits = Math.ceil(1380 / dailyGoal)

  return (
    <JourneyAnimation
      level={level}
      dailyGoal={dailyGoal}
      totalUnits={totalUnits}
      onAnimationComplete={() => navigate('/roadmap', { replace: true })}
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

        {/* ── Post-signup flow (auth required, no app shell) ── */}
        <Route path="/assessment" element={<AuthGate><AssessmentPage /></AuthGate>} />
        <Route path="/goal"       element={<AuthGate><GoalPage /></AuthGate>} />
        <Route path="/journey"    element={<AuthGate><JourneyPage /></AuthGate>} />

        {/* ── Protected (with app shell) ── */}
        <Route element={<AuthGate><AppLayout /></AuthGate>}>
          <Route path="/roadmap"       element={<Roadmap />} />
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



/*when i signed up, it just showed me the roadmap straightaway, without even having me choose my level or take the test, and pick the daily goal. also how is it gonna be arranged? r we using ai to arrange the journey, course, like sessions. also, the sessions are not working, and lets make it more interesting, like a real road, with curves, turnes, and dashes in between, round, 3D stations representing each session. also i checked the animation part, it is soo bad, i will try to send relevant info, and some great detailed prompts to describe it. in home, we should correct the arrangement, like our focus must be on the sessions, journey roadmap we created. liek duolingo, users must be able to tap in and do it. and get a streak or whatever. as i said, the words the user enters, is different, but it must be in the every 5th story mode, and also let's make in the of 15th session, make a test including all of past, like testing, different question types, all words, both from sessions, and users own words. also we must make it comfortable for them to simulatenously learn the words they want by just searching and adding them, maybe you can just add it to the next session straighaway ,that would be great */