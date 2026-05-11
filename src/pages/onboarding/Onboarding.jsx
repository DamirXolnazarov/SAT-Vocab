import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, User, Mail, Lock, ChevronRight, Check } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { supabase } from '../../lib/supabase'

// ─── Constants ────────────────────────────────────────────────────────────────

const DAILY_GOALS = [
  { value: 5,  label: '5 words',  sub: 'Casual',   mins: '~5 min'  },
  { value: 10, label: '10 words', sub: 'Regular',  mins: '~10 min' },
  { value: 15, label: '15 words', sub: 'Focused',  mins: '~15 min' },
  { value: 20, label: '20 words', sub: 'Intense',  mins: '~20 min' },
  { value: 30, label: '30 words', sub: 'Champion', mins: '~30 min' },
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

// ─── Shared components ────────────────────────────────────────────────────────

function StepDots({ current }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', gap: 6, marginTop: 28,
    }}>
      {[1, 2, 3].map(n => (
        <div
          key={n}
          style={{
            height: 6,
            width: n === current ? 24 : 6,
            borderRadius: 3,
            background: n <= current
              ? 'var(--c-primary)'
              : 'var(--c-border)',
            opacity: n < current ? 0.35 : 1,
            transition: 'all 0.25s ease',
          }}
        />
      ))}
      <span style={{ fontSize: 11, color: 'var(--c-text-muted)', marginLeft: 6 }}>
        {current}/3
      </span>
    </div>
  )
}

function Logo() {
  return (
    <div style={{ marginBottom: 32, textAlign: 'center' }}>
      <div style={{
        width: 52, height: 52,
        background: 'var(--c-primary)',
        borderRadius: 16, margin: '0 auto 10px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 16px rgba(139,26,46,0.25)',
      }}>
        <span style={{ color: '#fff', fontWeight: 900, fontSize: 24, fontFamily: 'Georgia, serif' }}>
          V
        </span>
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--c-text)', letterSpacing: '-0.3px' }}>
        Vocabook
      </div>
    </div>
  )
}

function InputField({ icon, label, type = 'text', value, onChange, error, placeholder, autoComplete }) {
  const [showPass, setShowPass] = useState(false)
  const isPassword = type === 'password'
  const inputType  = isPassword ? (showPass ? 'text' : 'password') : type

  return (
    <div style={{ marginBottom: 14 }}>
      {label && (
        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--c-text)', marginBottom: 6 }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        {icon && (
          <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--c-text-muted)', pointerEvents: 'none' }}>
            {icon}
          </div>
        )}
        <input
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          style={{
            width: '100%', minHeight: 48,
            padding: icon ? '12px 40px 12px 40px' : '12px 14px',
            paddingRight: isPassword ? 40 : 14,
            background: 'var(--c-bg)',
            border: `1.5px solid ${error ? 'var(--c-danger)' : 'var(--c-border)'}`,
            borderRadius: 'var(--r-sm)',
            fontSize: 15, color: 'var(--c-text)',
            outline: 'none', boxSizing: 'border-box',
            transition: 'border-color 0.15s ease',
          }}
          onFocus={e => { if (!error) e.target.style.borderColor = 'var(--c-primary)' }}
          onBlur={e => { if (!error) e.target.style.borderColor = 'var(--c-border)' }}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPass(s => !s)}
            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-text-muted)', padding: 2 }}
          >
            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error && (
        <p style={{ fontSize: 12, color: 'var(--c-danger)', marginTop: 4 }}>{error}</p>
      )}
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

  const set = field => e => setForm(f => ({ ...f, [field]: e.target.value }))

  const validate = () => {
    const e = {}
    if (mode === 'signup') {
      if (!form.username.trim())         e.username = 'Required'
      else if (form.username.length < 3) e.username = 'Min 3 characters'
    }
    if (!form.email.includes('@')) e.email    = 'Enter a valid email'
    if (form.password.length < 6)  e.password = 'Min 6 characters'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    setErrors({})
    try {
      if (mode === 'signup') {
        await signUp({ email: form.email, password: form.password, username: form.username })
      } else {
        await signIn({ email: form.email, password: form.password })
      }
      onNext()
    } catch (err) {
      setErrors({ general: err.message || 'Something went wrong. Try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100svh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '32px 24px',
      background: 'var(--c-bg-off)',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <Logo />

        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--c-text)', marginBottom: 4, textAlign: 'center' }}>
          {mode === 'signup' ? 'Create your account' : 'Welcome back'}
        </h2>
        <p style={{ fontSize: 14, color: 'var(--c-text-muted)', marginBottom: 24, textAlign: 'center' }}>
          {mode === 'signup' ? 'Start mastering SAT vocabulary today' : 'Log in to continue your streak'}
        </p>

        {/* Mode toggle */}
        <div style={{
          display: 'flex', background: 'var(--c-bg-subtle)',
          borderRadius: 'var(--r-sm)', padding: 4, marginBottom: 24,
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
                boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {m === 'signup' ? 'Sign up' : 'Log in'}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {mode === 'signup' && (
              <InputField
                icon={<User size={15} />}
                label="Username"
                value={form.username}
                onChange={set('username')}
                error={errors.username}
                placeholder="e.g. johndoe"
                autoComplete="username"
              />
            )}
            <InputField
              icon={<Mail size={15} />}
              label="Email"
              type="email"
              value={form.email}
              onChange={set('email')}
              error={errors.email}
              placeholder="you@email.com"
              autoComplete="email"
            />
            <InputField
              icon={<Lock size={15} />}
              label="Password"
              type="password"
              value={form.password}
              onChange={set('password')}
              error={errors.password}
              placeholder="Min 6 characters"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            />
          </motion.div>
        </AnimatePresence>

        {errors.general && (
          <div style={{
            padding: '10px 14px', marginBottom: 14,
            background: 'var(--c-danger-pale)',
            border: '1px solid var(--c-danger)',
            borderRadius: 'var(--r-sm)',
            fontSize: 13, color: 'var(--c-danger)',
          }}>
            {errors.general}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%', minHeight: 48, marginBottom: 14,
            background: 'var(--c-primary)', color: '#fff',
            border: 'none', borderRadius: 'var(--r-sm)',
            fontSize: 15, fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.75 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'opacity 0.15s ease',
          }}
        >
          {loading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
              style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }}
            />
          ) : mode === 'signup' ? 'Create account' : 'Log in'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--c-border)' }} />
          <span style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>or</span>
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--c-border)' }} />
        </div>

        <button
          onClick={onGuest}
          style={{
            width: '100%', minHeight: 48,
            background: 'transparent', color: 'var(--c-text-muted)',
            border: '1px solid var(--c-border)',
            borderRadius: 'var(--r-sm)',
            fontSize: 14, fontWeight: 500, cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseOver={e => e.currentTarget.style.borderColor = 'var(--c-border-strong)'}
          onMouseOut={e => e.currentTarget.style.borderColor = 'var(--c-border)'}
        >
          Continue as guest
        </button>
      </div>
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
      <div style={{ width: '100%', maxWidth: 400, margin: '0 auto' }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'none', border: 'none',
            color: 'var(--c-text-muted)', fontSize: 14,
            cursor: 'pointer', padding: 0, marginBottom: 28,
          }}
        >
          <ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} />
          Back
        </button>

        <Logo />

        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--c-text)', marginBottom: 4 }}>
          Set your daily goal
        </h2>
        <p style={{ fontSize: 14, color: 'var(--c-text-muted)', marginBottom: 24 }}>
          How many words do you want to learn each day?
        </p>

        {/* Goal options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 32 }}>
          {DAILY_GOALS.map(({ value, label, sub, mins }) => {
            const active = goal === value
            return (
              <motion.button
                key={value}
                whileTap={{ scale: 0.99 }}
                onClick={() => setGoal(value)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '13px 16px', textAlign: 'left',
                  background: active ? 'var(--c-primary-pale)' : 'var(--c-bg)',
                  border: `1.5px solid ${active ? 'var(--c-primary)' : 'var(--c-border)'}`,
                  borderRadius: 'var(--r-card)', cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: active ? 'var(--c-primary)' : 'var(--c-text)' }}>
                      {label}/day
                    </span>
                    <span style={{
                      fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 99,
                      background: active ? 'var(--c-primary)' : 'var(--c-bg-subtle)',
                      color: active ? '#fff' : 'var(--c-text-muted)',
                    }}>
                      {sub}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--c-text-muted)', marginTop: 2 }}>{mins}</div>
                </div>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                  border: `2px solid ${active ? 'var(--c-primary)' : 'var(--c-border)'}`,
                  background: active ? 'var(--c-primary)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s ease',
                }}>
                  {active && <Check size={11} color="#fff" strokeWidth={3} />}
                </div>
              </motion.button>
            )
          })}
        </div>

        {/* Avatar */}
        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-text)', marginBottom: 12 }}>
          Pick your avatar
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 6, marginBottom: 32 }}>
          {AVATARS.map((emoji, i) => (
            <motion.button
              key={i}
              whileTap={{ scale: 0.85 }}
              onClick={() => setAvatar(i)}
              style={{
                fontSize: 20, padding: 5, lineHeight: 1,
                borderRadius: 8,
                border: `2px solid ${avatar === i ? 'var(--c-primary)' : 'transparent'}`,
                background: avatar === i ? 'var(--c-primary-pale)' : 'transparent',
                cursor: 'pointer', transition: 'all 0.12s ease',
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
            fontSize: 15, fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.75 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {loading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
              style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }}
            />
          ) : (
            <>Continue <ChevronRight size={16} /></>
          )}
        </button>
      </div>
      <StepDots current={2} />
    </div>
  )
}

// ─── Step 3: First word ───────────────────────────────────────────────────────

function Step3({ onDone }) {
  const [flipped, setFlipped] = useState(false)

  return (
    <div style={{
      minHeight: '100svh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '32px 24px',
      background: 'var(--c-bg-off)',
    }}>
      <div style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'var(--c-success-pale)',
          border: '1px solid var(--c-success)',
          borderRadius: 99, padding: '6px 16px', marginBottom: 20,
        }}>
          <Check size={14} color="var(--c-success)" strokeWidth={2.5} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-success)' }}>
            Account created
          </span>
        </div>

        <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--c-text)', marginBottom: 6, fontFamily: 'Georgia, serif' }}>
          Here's your first word
        </h2>
        <p style={{ fontSize: 14, color: 'var(--c-text-muted)', marginBottom: 28 }}>
          Tap the card to reveal its meaning
        </p>

        {/* Flashcard */}
        <div
          onClick={() => setFlipped(f => !f)}
          style={{
            background: 'var(--c-bg)',
            border: '1px solid var(--c-border)',
            borderRadius: 20, padding: '32px 28px',
            marginBottom: 20, cursor: 'pointer',
            boxShadow: '0 4px 24px rgba(139,26,46,0.08)',
            minHeight: 220,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            position: 'relative', overflow: 'hidden',
            textAlign: 'center',
          }}
        >
          <div style={{
            position: 'absolute', top: -20, right: -20,
            width: 100, height: 100, borderRadius: '50%',
            background: 'var(--c-primary-pale)', pointerEvents: 'none',
          }} />

          <div style={{ fontSize: 11, color: 'var(--c-text-muted)', marginBottom: 12, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {flipped ? 'Definition' : 'Tap to reveal'}
          </div>

          <AnimatePresence mode="wait">
            {!flipped ? (
              <motion.div
                key="front"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <div style={{ fontSize: 34, fontWeight: 900, color: 'var(--c-text)', fontFamily: 'Georgia, serif', letterSpacing: '-0.5px', marginBottom: 8 }}>
                  {SAMPLE_WORD.word}
                </div>
                <div style={{ fontSize: 14, color: 'var(--c-text-muted)', marginBottom: 4 }}>
                  {SAMPLE_WORD.pronunciation}
                </div>
                <div style={{ fontSize: 12, color: 'var(--c-primary)', fontWeight: 500 }}>
                  {SAMPLE_WORD.part_of_speech}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="back"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <p style={{ fontSize: 16, color: 'var(--c-text)', lineHeight: 1.65, marginBottom: 14 }}>
                  {SAMPLE_WORD.definition}
                </p>
                <p style={{ fontSize: 13, color: 'var(--c-text-muted)', fontStyle: 'italic', lineHeight: 1.5, marginBottom: 14 }}>
                  "{SAMPLE_WORD.example}"
                </p>
                <div style={{ background: 'var(--c-gold-pale)', border: '1px solid var(--c-gold-light)', borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--c-gold)', marginBottom: 4 }}>MEMORY TRICK</div>
                  <div style={{ fontSize: 13, color: 'var(--c-text)', lineHeight: 1.5 }}>{SAMPLE_WORD.mnemonic}</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onDone}
          style={{
            width: '100%', minHeight: 52,
            background: 'var(--c-primary)', color: '#fff',
            border: 'none', borderRadius: 'var(--r-sm)',
            fontSize: 16, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          Start learning <ChevronRight size={18} />
        </motion.button>
      </div>

      <StepDots current={3} />
    </div>
  )
}

// ─── Onboarding ───────────────────────────────────────────────────────────────

export function Onboarding() {
  const [step,   setStep]   = useState(1)
  const navigate            = useNavigate()
  const { user }            = useAuthStore()

  // Redirect if already logged in
  useEffect(() => {
    if (user) navigate('/home', { replace: true })
  }, [user])

  const handleGuest = async () => {
    try {
      await supabase.auth.signInAnonymously()
    } catch (err) {
      console.warn('Anonymous sign-in failed:', err.message)
    }
    navigate('/home', { replace: true })
  }

  const variants = {
    enter:  { opacity: 0, x: 24  },
    center: { opacity: 1, x: 0   },
    exit:   { opacity: 0, x: -24 },
  }

  return (
    <div style={{ background: 'var(--c-bg-off)', minHeight: '100svh' }}>
      <AnimatePresence mode="wait" initial={false}>
        {step === 1 && (
          <motion.div key="s1" variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.18, ease: 'easeOut' }}>
            <Step1 onNext={() => setStep(2)} onGuest={handleGuest} />
          </motion.div>
        )}
        {step === 2 && (
          <motion.div key="s2" variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.18, ease: 'easeOut' }}>
            <Step2 onNext={() => setStep(3)} onBack={() => setStep(1)} />
          </motion.div>
        )}
        {step === 3 && (
          <motion.div key="s3" variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.18, ease: 'easeOut' }}>
            <Step3 onDone={() => navigate('/assessment', { replace: true })} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}