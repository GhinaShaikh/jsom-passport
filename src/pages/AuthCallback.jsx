import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, getPassport, createPassport } from '../lib/supabase'

const UTD = {
  orange: '#C75B12',
  green: '#154734',
  white: '#FFFFFF',
}

/**
 * /auth/callback
 *
 * Supabase redirects here after:
 *   1. A user clicks the email verification link (sign-up)
 *   2. A user clicks a magic link (sign-in)
 *
 * This page:
 *   - Exchanges the URL token for a real session
 *   - If new user: creates their passport row in the DB
 *   - Redirects to /passport
 */
export default function AuthCallback() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('Verifying your link…')
  const [error, setError] = useState(null)

  useEffect(() => {
    async function handleCallback() {
      try {
        // exchangeCodeForSession handles both PKCE and implicit flows.
        // Supabase JS v2 does this automatically when it detects the URL params.
        const { data, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) throw sessionError

        const user = data?.session?.user
        if (!user) throw new Error('No session found — the link may have expired.')

        setStatus('Authenticated! Setting up your passport…')

        // Check if a passport already exists for this user
        const { data: existing, error: fetchError } = await getPassport(user.id)
        if (fetchError) throw fetchError

        if (!existing) {
          // First-time sign-in after email verification → create passport row
          setStatus('Creating your Comet Passport…')
          const { error: createError } = await createPassport(user)
          if (createError) throw createError
        }

        setStatus('All done! Redirecting…')
        setTimeout(() => navigate('/passport', { replace: true }), 800)
      } catch (err) {
        console.error('Auth callback error:', err)
        setError(err.message ?? 'Something went wrong. Please try again.')
      }
    }

    handleCallback()
  }, [navigate])

  return (
    <div style={{
      minHeight: '100vh',
      background: UTD.green,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 20,
      fontFamily: "'Oswald', sans-serif",
      padding: 24,
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500&family=Libre+Baskerville:ital@1&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {!error ? (
        <>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            border: `3px solid ${UTD.orange}`,
            borderTopColor: 'transparent',
            animation: 'spin 0.9s linear infinite',
          }} />
          <div style={{ color: UTD.white, fontSize: 16, letterSpacing: 3 }}>{status}</div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontFamily: "'Libre Baskerville', serif", fontStyle: 'italic', fontSize: 12 }}>
            Welcome, Comet
          </div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 36 }}>⚠️</div>
          <div style={{ color: UTD.white, fontSize: 16, letterSpacing: 2, textAlign: 'center' }}>Verification Failed</div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, textAlign: 'center', maxWidth: 320, lineHeight: 1.6 }}>{error}</div>
          <button
            onClick={() => navigate('/', { replace: true })}
            style={{
              marginTop: 8,
              background: UTD.orange, color: 'white', border: 'none',
              borderRadius: 6, padding: '12px 32px',
              fontFamily: "'Oswald', sans-serif", fontSize: 13, letterSpacing: 3,
              cursor: 'pointer',
            }}
          >
            BACK TO HOME
          </button>
        </>
      )}
    </div>
  )
}
