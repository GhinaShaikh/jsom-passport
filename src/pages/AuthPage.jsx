import { useState } from 'react'
import { signUp, signInWithMagicLink } from '../lib/supabase'

const UTD = {
  orange: '#C75B12',
  orangeLight: '#E8722A',
  green: '#154734',
  white: '#FFFFFF',
}

// ─── ALL JSOM PROGRAMS ────────────────────────────────────────────────────────
const PROGRAMS = [
  { group: '── Bachelor of Science (BS) ──', options: [
    'BS Accounting',
    'BS Business Administration',
    'BS Business Analytics and Artificial Intelligence',
    'BS Computer Information Systems & Technology',
    'BS Cybersecurity and Risk Management',
    'BS Finance',
    'BS Global Business',
    'BS Healthcare Management',
    'BS Human Resource Management',
    'BS Marketing',
    'BS Supply Chain Management and Analytics',
  ]},
  { group: '── Master of Science (MS) ──', options: [
    'MS Accounting and Analytics',
    'MS Business Analytics and Artificial Intelligence',
    'MS Energy Management',
    'MS Finance',
    'MS Financial Technology & Analytics',
    'MS Healthcare Leadership & Management',
    'MS Information Technology & Management',
    'MS Innovation and Entrepreneurship',
    'MS International Management Studies',
    'MS Management Science',
    'MS Marketing',
    'MS Supply Chain Management',
    'MS Systems Engineering & Management',
  ]},
  { group: '── MBA ──', options: [
    'MBA Full-Time',
    'MBA Professional Evening Cohort',
    'MBA Professional Flex',
    'MBA Professional Online',
    'MBA Executive',
  ]},
  { group: '── PhD ──', options: [
    'PhD International Management Studies',
    'PhD Management Science',
  ]},
  { group: '── Other ──', options: [
    'Doctor of Business Administration (DBA)',
    'Executive Education',
    'Certificate Program',
    'Alumni',
  ]},
]

// Generate class years
const YEARS = Array.from({ length: 56 }, (_, i) => String(2030 - i))

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Oswald:wght@400;500;600&display=swap');
  @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin { to{transform:rotate(360deg)} }
  .btn-primary { transition: all 0.2s; }
  .btn-primary:hover { background: ${UTD.orangeLight} !important; transform: translateY(-1px); }
  .auth-input { transition: border-color 0.2s, box-shadow 0.2s; }
  .auth-input:focus { outline: none; border-color: ${UTD.orange} !important; box-shadow: 0 0 0 3px ${UTD.orange}33; }
  .tab-btn { transition: all 0.2s; cursor: pointer; }
  .auth-select {
    width: 100%; box-sizing: border-box;
    background: rgba(255,255,255,0.07);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 5; padding: 11px 14px;
    color: white; font-family: 'Libre Baskerville', serif; font-size: 13px;
    cursor: pointer; appearance: none; -webkit-appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23E8722A' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 14px center;
    padding-right: 36px;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .auth-select:focus { outline: none; border-color: ${UTD.orange} !important; box-shadow: 0 0 0 3px ${UTD.orange}33; }
  .auth-select option { background: #1a3a2a; color: white; }
  .auth-select option[disabled] { color: rgba(255,255,255,0.3); font-style: italic; }
`

// ─── SHARED DROPDOWN COMPONENT ────────────────────────────────────────────────
function SelectField({ label, value, onChange, error, children, placeholder }) {
  return (
    <div>
      <div style={{ color: UTD.orangeLight, fontFamily: 'monospace', fontSize: 9, letterSpacing: 3, marginBottom: 5 }}>{label}</div>
      <div style={{ position: 'relative' }}>
        <select
          className="auth-select"
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            width: '100%', boxSizing: 'border-box',
            background: 'rgba(255,255,255,0.07)',
            border: `1px solid ${error ? '#ff6b6b' : 'rgba(255,255,255,0.15)'}`,
            borderRadius: 5, padding: '11px 36px 11px 14px',
            color: value ? 'white' : 'rgba(255,255,255,0.35)',
            fontFamily: "'Libre Baskerville', serif", fontSize: 13,
            cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none',
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23E8722A' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\")",
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 14px center',
          }}
        >
          <option value="" disabled style={{ background: '#0d3327', color: 'rgba(255,255,255,0.4)' }}>{placeholder}</option>
          {children}
        </select>
      </div>
      {error && <div style={{ color: '#ff8a80', fontSize: 10, fontFamily: 'monospace', marginTop: 3 }}>{error}</div>}
    </div>
  )
}

// ─── SIGN UP TAB ──────────────────────────────────────────────────────────────
function SignUpTab() {
  const [form, setForm] = useState({ name: '', email: '', major: '', year: '' })
  const [errors, setErrors] = useState({})
  const [state, setState] = useState('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.email.includes('@')) e.email = 'Valid email required'
    if (!form.major) e.major = 'Please select your program'
    if (!form.year) e.year = 'Please select your class year'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setState('loading')
    const { error } = await signUp(form)
    if (error) {
      if (error.message?.toLowerCase().includes('already registered')) {
        setErrorMsg('This email is already registered. Use Sign In to get a magic link.')
      } else {
        setErrorMsg(error.message)
      }
      setState('error')
    } else {
      setState('sent')
    }
  }

  if (state === 'sent') {
    return (
      <div style={{ animation: 'fadeUp 0.5s ease forwards', textAlign: 'center', padding: '20px 0' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✉️</div>
        <div style={{ color: UTD.white, fontFamily: "'Oswald', sans-serif", fontSize: 18, letterSpacing: 3, marginBottom: 10 }}>CHECK YOUR EMAIL</div>
        <div style={{ color: 'rgba(255,255,255,0.6)', fontFamily: "'Libre Baskerville', serif", fontSize: 13, lineHeight: 1.8, maxWidth: 300, margin: '0 auto' }}>
          We sent a verification link to <strong style={{ color: UTD.orangeLight }}>{form.email}</strong>. Click it to activate your Comet Passport.
        </div>
        <div style={{ marginTop: 20, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', fontSize: 10, letterSpacing: 2 }}>The link expires in 1 hour</div>
      </div>
    )
  }

  return (
    <div style={{ animation: 'fadeUp 0.4s ease forwards', display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Name */}
      <div>
        <div style={{ color: UTD.orangeLight, fontFamily: 'monospace', fontSize: 9, letterSpacing: 3, marginBottom: 5 }}>FULL NAME</div>
        <input
          className="auth-input"
          type="text"
          placeholder="e.g. Alex Johnson"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          style={{
            width: '100%', boxSizing: 'border-box',
            background: 'rgba(255,255,255,0.07)',
            border: `1px solid ${errors.name ? '#ff6b6b' : 'rgba(255,255,255,0.15)'}`,
            borderRadius: 5, padding: '11px 14px', color: 'white',
            fontFamily: "'Libre Baskerville', serif", fontSize: 13,
          }}
        />
        {errors.name && <div style={{ color: '#ff8a80', fontSize: 10, fontFamily: 'monospace', marginTop: 3 }}>{errors.name}</div>}
      </div>

      {/* Email */}
      <div>
        <div style={{ color: UTD.orangeLight, fontFamily: 'monospace', fontSize: 9, letterSpacing: 3, marginBottom: 5 }}>EMAIL ADDRESS</div>
        <input
          className="auth-input"
          type="email"
          placeholder="abc@domain.com"
          value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          style={{
            width: '100%', boxSizing: 'border-box',
            background: 'rgba(255,255,255,0.07)',
            border: `1px solid ${errors.email ? '#ff6b6b' : 'rgba(255,255,255,0.15)'}`,
            borderRadius: 5, padding: '11px 14px', color: 'white',
            fontFamily: "'Libre Baskerville', serif", fontSize: 13,
          }}
        />
        {errors.email && <div style={{ color: '#ff8a80', fontSize: 10, fontFamily: 'monospace', marginTop: 3 }}>{errors.email}</div>}
      </div>

      {/* Major dropdown */}
      <SelectField
        label="PROGRAM / MAJOR"
        value={form.major}
        onChange={v => setForm(f => ({ ...f, major: v }))}
        error={errors.major}
        placeholder="Select your program..."
      >
        {PROGRAMS.map(({ group, options }) => (
          <optgroup key={group} label={group} style={{ color: UTD.orangeLight, background: '#0d3327', fontFamily: 'monospace', fontSize: 10 }}>
            {options.map(opt => (
              <option key={opt} value={opt} style={{ background: '#0d3327', color: 'white', fontFamily: "'Libre Baskerville', serif" }}>{opt}</option>
            ))}
          </optgroup>
        ))}
      </SelectField>

      {/* Year dropdown */}
      <SelectField
        label="CLASS YEAR"
        value={form.year}
        onChange={v => setForm(f => ({ ...f, year: v }))}
        error={errors.year}
        placeholder="Select your graduation year..."
      >
        {YEARS.map(y => (
          <option key={y} value={y} style={{ background: '#0d3327', color: 'white' }}>{y}</option>
        ))}
      </SelectField>

      {state === 'error' && (
        <div style={{ background: 'rgba(255,100,100,0.1)', border: '1px solid rgba(255,100,100,0.3)', borderRadius: 5, padding: '10px 14px', color: '#ff8a80', fontFamily: 'monospace', fontSize: 11 }}>
          {errorMsg}
        </div>
      )}

      <button
        className="btn-primary"
        onClick={handleSubmit}
        disabled={state === 'loading'}
        style={{
          marginTop: 4, background: UTD.orange, color: 'white', border: 'none',
          borderRadius: 6, padding: '14px', fontFamily: "'Oswald', sans-serif",
          fontSize: 14, letterSpacing: 3, cursor: 'pointer', fontWeight: 500,
          opacity: state === 'loading' ? 0.7 : 1,
        }}
      >
        {state === 'loading' ? 'CREATING PASSPORT…' : 'CREATE MY PASSPORT →'}
      </button>
    </div>
  )
}

// ─── SIGN IN TAB ──────────────────────────────────────────────────────────────
function SignInTab() {
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [state, setState] = useState('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async () => {
    if (!email.includes('@')) { setEmailError('Valid email required'); return }
    setEmailError('')
    setState('loading')
    const { error } = await signInWithMagicLink(email)
    if (error) { setErrorMsg(error.message); setState('error') }
    else setState('sent')
  }

  if (state === 'sent') {
    return (
      <div style={{ animation: 'fadeUp 0.5s ease forwards', textAlign: 'center', padding: '20px 0' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔗</div>
        <div style={{ color: UTD.white, fontFamily: "'Oswald', sans-serif", fontSize: 18, letterSpacing: 3, marginBottom: 10 }}>MAGIC LINK SENT</div>
        <div style={{ color: 'rgba(255,255,255,0.6)', fontFamily: "'Libre Baskerville', serif", fontSize: 13, lineHeight: 1.8, maxWidth: 300, margin: '0 auto' }}>
          Check your inbox at <strong style={{ color: UTD.orangeLight }}>{email}</strong> and click the link to sign in instantly.
        </div>
        <div style={{ marginTop: 20, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', fontSize: 10, letterSpacing: 2 }}>No password needed · Link expires in 1 hour</div>
      </div>
    )
  }

  return (
    <div style={{ animation: 'fadeUp 0.4s ease forwards', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ color: 'rgba(255,255,255,0.55)', fontFamily: "'Libre Baskerville', serif", fontStyle: 'italic', fontSize: 13, lineHeight: 1.7 }}>
        Enter your email and we'll send you a one-click login link. No password required.
      </div>
      <div>
        <div style={{ color: UTD.orangeLight, fontFamily: 'monospace', fontSize: 9, letterSpacing: 3, marginBottom: 5 }}>EMAIL ADDRESS</div>
        <input
          className="auth-input"
          type="email"
          placeholder="abc@domain.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          style={{
            width: '100%', boxSizing: 'border-box',
            background: 'rgba(255,255,255,0.07)',
            border: `1px solid ${emailError ? '#ff6b6b' : 'rgba(255,255,255,0.15)'}`,
            borderRadius: 5, padding: '11px 14px', color: 'white',
            fontFamily: "'Libre Baskerville', serif", fontSize: 13,
          }}
        />
        {emailError && <div style={{ color: '#ff8a80', fontSize: 10, fontFamily: 'monospace', marginTop: 3 }}>{emailError}</div>}
      </div>

      {state === 'error' && (
        <div style={{ background: 'rgba(255,100,100,0.1)', border: '1px solid rgba(255,100,100,0.3)', borderRadius: 5, padding: '10px 14px', color: '#ff8a80', fontFamily: 'monospace', fontSize: 11 }}>
          {errorMsg}
        </div>
      )}

      <button
        className="btn-primary"
        onClick={handleSubmit}
        disabled={state === 'loading'}
        style={{
          background: UTD.orange, color: 'white', border: 'none',
          borderRadius: 6, padding: '14px', fontFamily: "'Oswald', sans-serif",
          fontSize: 14, letterSpacing: 3, cursor: 'pointer', fontWeight: 500,
          opacity: state === 'loading' ? 0.7 : 1,
        }}
      >
        {state === 'loading' ? 'SENDING LINK…' : 'SEND MAGIC LINK →'}
      </button>
    </div>
  )
}

// ─── MAIN AUTH PAGE ───────────────────────────────────────────────────────────
export default function AuthPage() {
  const [tab, setTab] = useState('signup')

  return (
    <div style={{
      minHeight: '100vh', background: UTD.green,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 24, position: 'relative', overflow: 'hidden',
    }}>
      <style>{STYLES}</style>

      {/* Background texture */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.04, pointerEvents: 'none' }}>
        <defs><pattern id="bg" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
          <text x="4" y="20" fontSize="10" fill="white" fontFamily="monospace">UTD</text>
          <text x="30" y="50" fontSize="10" fill="white" fontFamily="monospace">UTD</text>
        </pattern></defs>
        <rect width="100%" height="100%" fill="url(#bg)" />
      </svg>

      <div style={{ width: '100%', maxWidth: 400, position: 'relative' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 28, color: UTD.white, letterSpacing: 5, fontWeight: 600 }}>COMET PASSPORT</div>
          <div style={{ fontFamily: "'Libre Baskerville', serif", fontStyle: 'italic', color: UTD.orangeLight, fontSize: 13, marginTop: 4 }}>
            Naveen Jindal School of Management
          </div>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', marginBottom: 24, border: '1px solid rgba(255,255,255,0.12)', borderRadius: 7, overflow: 'hidden' }}>
          {[['signup', 'CREATE PASSPORT'], ['signin', 'SIGN IN']].map(([key, label]) => (
            <button
              key={key}
              className="tab-btn"
              onClick={() => setTab(key)}
              style={{
                flex: 1, padding: '12px 0', border: 'none',
                background: tab === key ? UTD.orange : 'transparent',
                color: tab === key ? 'white' : 'rgba(255,255,255,0.45)',
                fontFamily: "'Oswald', sans-serif", fontSize: 11, letterSpacing: 3,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'signup' ? <SignUpTab /> : <SignInTab />}
      </div>
    </div>
  )
}
