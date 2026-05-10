import { useState, useEffect} from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../../stores/authStore'
import { supabase } from '../../lib/supabase'

// ─── Constants ────────────────────────────────────────────────────────────────

const DAILY_GOALS = [
  { value: 5,  label: '5 words/day',  tag: 'Casual',   emoji: '🌱', desc: '~5 min'  },
  { value: 10, label: '10 words/day', tag: 'Regular',  emoji: '📚', desc: '~10 min' },
  { value: 15, label: '15 words/day', tag: 'Focused',  emoji: '🎯', desc: '~15 min' },
  { value: 20, label: '20 words/day', tag: 'Intense',  emoji: '🔥', desc: '~20 min' },
  { value: 30, label: '30 words/day', tag: 'Champion', emoji: '🏆', desc: '~30 min' },
]

const AVATARS = [
  '🦁','🐯','🦊','🐺','🐻','🦋',
  '🐉','🦅','🌟','⚡','🎯','🔥',
  '💎','🚀','🌊','🏔️','🌙','☀️','🎪','🎭',
]

const SAMPLE_WORD = {
  word:           'Ephemeral',
  pronunciation:  '/ɪˈfem.ər.əl/',
  part_of_speech: 'adjective',
  definition:     'Lasting for only a short time; transitory.',
  example:        'The ephemeral beauty of cherry blossoms makes them all the more precious.',
  mnemonic:       'Think "e-FEM-eral" — like a femur bone, fleeting and fragile.',
}

// ─── Shared ───────────────────────────────────────────────────────────────────

function StepDots({ current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 24 }}>
      {[1, 2, 3].map(n => (
        <div key={n} style={{
          height: 8,
          width: n === current ? 24 : 8,
          borderRadius: 4,
          background: n <= current ? 'var(--c-primary)' : 'var(--c-border)',
          opacity: n < current ? 0.4 : 1,
          transition: 'all 0.3s ease',
        }} />
      ))}
      <p style={{ fontSize: 11, color: 'var(--c-text-muted)', marginLeft: 8 }}>
        Step {current} of 3
      </p>
    </div>
  )
}

function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
      <div style={{
        width: 44, height: 44,
        background: 'var(--c-primary)',
        borderRadius: 12,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: 'var(--shadow-md)',
        flexShrink: 0,
      }}>
        <span style={{ color: '#fff', fontWeight: 900, fontSize: 20 }}>V</span>
      </div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--c-text)', lineHeight: 1 }}>
          Vocabook
        </div>
      </div>
    </div>
  )
}

// ─── Step 1: Auth ─────────────────────────────────────────────────────────────

function Step1({ onNext, onGuest }) {
  const [mode,    setMode]    = useState('signup')
  const [form,    setForm]    = useState({ username: '', email: '', password: '' })
  const [errors,  setErrors]  = useState({})
  const [loading, setLoading] = useState(false)
  const { signUp, signIn }    = useAuthStore()

  const setField = (field) => (e) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  const validate = () => {
    const e = {}
    if (mode === 'signup') {
      if (!form.username.trim())      e.username = 'Required'
      else if (form.username.length < 3) e.username = 'Min 3 characters'
    }
    if (!form.email.includes('@'))    e.email    = 'Enter a valid email'
    if (form.password.length < 6)    e.password = 'Min 6 characters'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    setErrors({})
    try {
      if (mode === 'signup') {
        await signUp({
          email:    form.email,
          password: form.password,
          username: form.username,
        })
      } else {
        await signIn({
          email:    form.email,
          password: form.password,
        })
      }
      onNext()
    } catch (err) {
      setErrors({ general: err.message || 'Something went wrong. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = (field) => ({
    width: '100%',
    padding: '12px 14px',
    minHeight: 48,
    background: 'var(--c-bg)',
    border: `1.5px solid ${errors[field] ? 'var(--c-danger)' : 'var(--c-border)'}`,
    borderRadius: 'var(--r-sm)',
    color: 'var(--c-text)',
    fontSize: 16,
    outline: 'none',
    transition: 'border-color 0.15s ease',
    boxSizing: 'border-box',
  })

  return (
    <div style={{
      minHeight: '100svh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '32px 24px',
      background: 'var(--c-bg-off)',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ width: '100%', maxWidth: 400 }}
      >
        <Logo />

        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--c-text)', marginBottom: 4 }}>
          {mode === 'signup' ? 'Create your account' : 'Welcome back'}
        </h2>
        <p style={{ fontSize: 14, color: 'var(--c-text-muted)', marginBottom: 24 }}>
          {mode === 'signup'
            ? 'Start mastering SAT vocabulary today'
            : 'Log in to continue your streak'}
        </p>

        {/* Mode toggle */}
        <div style={{
          display: 'flex',
          background: 'var(--c-bg-subtle)',
          borderRadius: 'var(--r-sm)',
          padding: 4, marginBottom: 24,
        }}>
          {['signup', 'login'].map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setErrors({}) }}
              style={{
                flex: 1, padding: '8px 0',
                fontSize: 14, fontWeight: 600,
                borderRadius: 6, border: 'none', cursor: 'pointer',
                transition: 'all 0.15s ease',
                background: mode === m ? 'var(--c-bg)' : 'transparent',
                color: mode === m ? 'var(--c-primary)' : 'var(--c-text-muted)',
                boxShadow: mode === m ? 'var(--shadow-sm)' : 'none',
              }}
            >
              {m === 'signup' ? 'Sign up' : 'Log in'}
            </button>
          ))}
        </div>

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {mode === 'signup' && (
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--c-text)', marginBottom: 6 }}>
                Username
              </label>
              <input
                style={inputStyle('username')}
                placeholder="e.g. johndoe"
                value={form.username}
                onChange={setField('username')}
                autoComplete="username"
              />
              {errors.username && (
                <p style={{ fontSize: 12, color: 'var(--c-danger)', marginTop: 4 }}>
                  {errors.username}
                </p>
              )}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--c-text)', marginBottom: 6 }}>
              Email
            </label>
            <input
              style={inputStyle('email')}
              type="email"
              placeholder="you@email.com"
              value={form.email}
              onChange={setField('email')}
              autoComplete="email"
            />
            {errors.email && (
              <p style={{ fontSize: 12, color: 'var(--c-danger)', marginTop: 4 }}>
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--c-text)', marginBottom: 6 }}>
              Password
            </label>
            <input
              style={inputStyle('password')}
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={setField('password')}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            />
            {errors.password && (
              <p style={{ fontSize: 12, color: 'var(--c-danger)', marginTop: 4 }}>
                {errors.password}
              </p>
            )}
          </div>

          {errors.general && (
            <div style={{
              padding: '10px 14px',
              background: 'var(--c-danger-pale)',
              color: 'var(--c-danger)',
              borderRadius: 'var(--r-sm)',
              fontSize: 13,
            }}>
              {errors.general}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: '100%', minHeight: 48,
              background: 'var(--c-primary)', color: '#fff',
              border: 'none', borderRadius: 'var(--r-sm)',
              fontSize: 16, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 8,
              transition: 'opacity 0.15s ease',
            }}
          >
            {loading ? (
              <span style={{
                width: 18, height: 18,
                border: '2px solid rgba(255,255,255,0.3)',
                borderTopColor: '#fff',
                borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
                display: 'inline-block',
              }} />
            ) : mode === 'signup' ? 'Create account' : 'Log in'}
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--c-border)' }} />
            <span style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>or</span>
            <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--c-border)' }} />
          </div>

          {/* Guest */}
          <button
            onClick={onGuest}
            style={{
              width: '100%', minHeight: 48,
              background: 'transparent',
              color: 'var(--c-text-muted)',
              border: '1px solid var(--c-border)',
              borderRadius: 'var(--r-sm)',
              fontSize: 15, fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Continue as guest
          </button>
        </div>
      </motion.div>

      <StepDots current={1} />
    </div>
  )
}

// ─── Step 2: Goal + Avatar ────────────────────────────────────────────────────

function Step2({ onNext, onBack }) {
  const [goal,    setGoal]    = useState(10)
  const [avatar,  setAvatar]  = useState(0)
  const [loading, setLoading] = useState(false)
  const { updateProfile }     = useAuthStore()

  const handleNext = async () => {
    setLoading(true)
    try {
      await updateProfile({ daily_goal: goal, avatar_id: avatar })
    } catch (err) {
      // non-fatal — proceed anyway
      console.warn('Profile update failed:', err.message)
    } finally {
      setLoading(false)
      onNext()
    }
  }

  return (
    <div style={{
      minHeight: '100svh',
      display: 'flex', flexDirection: 'column',
      padding: '32px 24px 40px',
      background: 'var(--c-bg-off)',
      overflowY: 'auto',
    }}>
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        style={{ width: '100%', maxWidth: 400, margin: '0 auto' }}
      >
        <button
          onClick={onBack}
          style={{
            background: 'none', border: 'none',
            color: 'var(--c-text-muted)', fontSize: 14,
            cursor: 'pointer', padding: 0, marginBottom: 24,
            display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          ← Back
        </button>

        <Logo />

        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--c-text)', marginBottom: 4 }}>
          Set your daily goal
        </h2>
        <p style={{ fontSize: 14, color: 'var(--c-text-muted)', marginBottom: 24 }}>
          How many words do you want to learn each day?
        </p>

        {/* Goal picker */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
          {DAILY_GOALS.map(({ value, label, tag, emoji, desc }) => {
            const active = goal === value
            return (
              <motion.button
                key={value}
                whileTap={{ scale: 0.98 }}
                onClick={() => setGoal(value)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 16px', textAlign: 'left',
                  background: active ? 'var(--c-primary-pale)' : 'var(--c-bg)',
                  border: `2px solid ${active ? 'var(--c-primary)' : 'var(--c-border)'}`,
                  borderRadius: 'var(--r-card)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{ fontSize: 24 }}>{emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontWeight: 600, fontSize: 15,
                    color: active ? 'var(--c-primary)' : 'var(--c-text)',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    {label}
                    <span style={{
                      fontSize: 11, fontWeight: 500,
                      padding: '2px 8px', borderRadius: 99,
                      background: active ? 'var(--c-primary)' : 'var(--c-bg-subtle)',
                      color: active ? '#fff' : 'var(--c-text-muted)',
                    }}>
                      {tag}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--c-text-muted)', marginTop: 2 }}>
                    {desc}
                  </div>
                </div>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                  border: `2px solid ${active ? 'var(--c-primary)' : 'var(--c-border)'}`,
                  background: active ? 'var(--c-primary)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {active && (
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />
                  )}
                </div>
              </motion.button>
            )
          })}
        </div>

        {/* Avatar picker */}
        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-text)', marginBottom: 12 }}>
          Pick your avatar
        </h3>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)',
          gap: 6, marginBottom: 32,
        }}>
          {AVATARS.map((emoji, i) => (
            <motion.button
              key={i}
              whileTap={{ scale: 0.85 }}
              onClick={() => setAvatar(i)}
              style={{
                fontSize: 20, padding: 6, lineHeight: 1,
                borderRadius: 'var(--r-sm)',
                border: `2px solid ${avatar === i ? 'var(--c-primary)' : 'transparent'}`,
                background: avatar === i ? 'var(--c-primary-pale)' : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {emoji}
            </motion.button>
          ))}
        </div>

        <button
          onClick={handleNext}
          disabled={loading}
          style={{
            width: '100%', minHeight: 48,
            background: 'var(--c-primary)', color: '#fff',
            border: 'none', borderRadius: 'var(--r-sm)',
            fontSize: 16, fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 8,
          }}
        >
          {loading ? (
            <span style={{
              width: 18, height: 18,
              border: '2px solid rgba(255,255,255,0.3)',
              borderTopColor: '#fff', borderRadius: '50%',
              animation: 'spin 0.7s linear infinite',
              display: 'inline-block',
            }} />
          ) : 'Continue →'}
        </button>
      </motion.div>

      <StepDots current={2} />
    </div>
  )
}

// ─── Step 3: First word ───────────────────────────────────────────────────────

function Step3({ onDone }) {
  return (
    <div style={{
      minHeight: '100svh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '32px 24px',
      background: 'var(--c-bg-off)',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}
      >
        <div style={{ fontSize: 52, marginBottom: 12 }}>🎉</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--c-text)', marginBottom: 4 }}>
          You're all set!
        </h2>
        <p style={{ fontSize: 14, color: 'var(--c-text-muted)', marginBottom: 28 }}>
          Here's your first SAT word
        </p>

        {/* Word card */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15 }}
          style={{
            background: 'var(--c-bg)',
            border: '1px solid var(--c-border)',
            borderRadius: 'var(--r-card)',
            padding: 24, marginBottom: 24,
            boxShadow: 'var(--shadow-md)',
            textAlign: 'left',
          }}
        >
          {/* State pill */}
          <span style={{
            display: 'inline-block',
            fontSize: 11, fontWeight: 600,
            padding: '3px 10px', borderRadius: 99,
            background: 'var(--c-state-new-bg)',
            color: 'var(--c-state-new)',
            marginBottom: 12,
          }}>
            New word
          </span>

          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--c-text)', marginBottom: 4 }}>
            {SAMPLE_WORD.word}
          </div>
          <div style={{ fontSize: 13, color: 'var(--c-text-muted)', marginBottom: 2 }}>
            {SAMPLE_WORD.pronunciation}
          </div>
          <div style={{ fontSize: 12, color: 'var(--c-primary)', fontWeight: 500, marginBottom: 14 }}>
            {SAMPLE_WORD.part_of_speech}
          </div>
          <div style={{ fontSize: 15, color: 'var(--c-text)', lineHeight: 1.6, marginBottom: 14 }}>
            {SAMPLE_WORD.definition}
          </div>

          <div style={{
            borderTop: '1px solid var(--c-border)',
            paddingTop: 14, marginBottom: 14,
          }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--c-text-muted)', marginBottom: 4 }}>
              EXAMPLE
            </div>
            <div style={{ fontSize: 13, color: 'var(--c-text)', fontStyle: 'italic', lineHeight: 1.5 }}>
              "{SAMPLE_WORD.example}"
            </div>
          </div>

          <div style={{
            borderTop: '1px solid var(--c-border)',
            paddingTop: 14,
            background: 'var(--c-gold-pale)',
            borderRadius: 'var(--r-sm)',
            padding: '12px',
            border: '1px solid var(--c-gold-light)',
          }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--c-gold)', marginBottom: 4 }}>
              💡 MEMORY TRICK
            </div>
            <div style={{ fontSize: 13, color: 'var(--c-text)', lineHeight: 1.5 }}>
              {SAMPLE_WORD.mnemonic}
            </div>
          </div>
        </motion.div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onDone}
          style={{
            width: '100%', minHeight: 52,
            background: 'var(--c-primary)', color: '#fff',
            border: 'none', borderRadius: 'var(--r-sm)',
            fontSize: 17, fontWeight: 700, cursor: 'pointer',
          }}
        >
          Start learning →
        </motion.button>
      </motion.div>

      <StepDots current={3} />
    </div>
  )
}

// ─── Onboarding orchestrator ──────────────────────────────────────────────────

export function Onboarding() {
  const [step, setStep] = useState(1)
  const navigate        = useNavigate()
  const { user }        = useAuthStore()

  // Already logged in — skip onboarding
  if (user) {
    navigate('/home', { replace: true })
    return null
  }

  const handleGuest = async () => {
    try {
      await supabase.auth.signInAnonymously()
    } catch (err) {
      // If anonymous sign-in not enabled, just navigate anyway
      console.warn('Anonymous sign-in failed:', err.message)
    }
    navigate('/home', { replace: true })
  }

  const slideVariants = {
    enter:  { opacity: 0, x: 40  },
    center: { opacity: 1, x: 0   },
    exit:   { opacity: 0, x: -40 },
  }

  return (
    <AnimatePresence mode="wait">
      {step === 1 && (
        <motion.div
          key="step1"
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.2 }}
        >
          <Step1
            onNext={() => setStep(2)}
            onGuest={handleGuest}
          />
        </motion.div>
      )}

      {step === 2 && (
        <motion.div
          key="step2"
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.2 }}
        >
          <Step2
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        </motion.div>
      )}

      {step === 3 && (
        <motion.div
          key="step3"
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.2 }}
        >
          <Step3 onDone={() => navigate('/assessment', { replace: true })} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}