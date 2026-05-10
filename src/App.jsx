import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'

// Layout
import { AppLayout } from './components/layout/AppLayout'

// Public
import { Landing }         from './pages/Landing'
import { Onboarding }      from './pages/onboarding/Onboarding'
import { LevelAssessment } from './pages/LevelAssessment'

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
      background: 'var(--c-bg-off)',
      gap: 20,
    }}>
      <div style={{
        width: 52, height: 52,
        background: 'var(--c-primary)',
        borderRadius: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 20px rgba(139,26,46,0.3)',
      }}>
        <span style={{
          color: '#fff', fontWeight: 900, fontSize: 26,
          fontFamily: 'Georgia, serif',
        }}>
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

// ─── Auth gate — blocks unauthenticated users ─────────────────────────────────

function AuthGate({ children }) {
  const { user, loading } = useAuthStore()
  if (loading) return <LoadingScreen />
  if (!user)   return <Navigate to="/" replace />
  return children
}

// ─── Assessment gate — redirects new users to placement test ──────────────────

function AssessmentGate({ children }) {
  const { user, profile, loading } = useAuthStore()
  if (loading) return <LoadingScreen />
  if (!user)   return <Navigate to="/" replace />

  // If profile has no level set yet (new user), send to assessment
  if (profile && !profile.level || profile?.level === null) {
    return <Navigate to="/assessment" replace />
  }

  return children
}

// ─── Level assessment wrapper (needs navigate) ────────────────────────────────

function AssessmentPage() {
  const navigate = useNavigate()
  return (
    <LevelAssessment
      onComplete={() => navigate('/home', { replace: true })}
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
        <Route path="/"            element={<Landing />} />
        <Route path="/onboarding"  element={<Onboarding />} />
        <Route path="/assessment"  element={
          <AuthGate><AssessmentPage /></AuthGate>
        } />

        {/* ── Protected (with app shell) ── */}
        <Route element={
          <AuthGate>
            <AppLayout />
          </AuthGate>
        }>
          <Route path="/home"          element={<AssessmentGate><Home /></AssessmentGate>} />
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