import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthContext'
import AuthPage from './pages/AuthPage'
import AuthCallback from './pages/AuthCallback'
import PassportPage from './pages/PassportPage'

// Redirects to /passport if logged in, otherwise to /
function ProtectedRoute({ children }) {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: '#154734',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', fontSize: 11, letterSpacing: 3 }}>
          LOADING…
        </div>
      </div>
    )
  }

  return session ? children : <Navigate to="/" replace />
}

// Redirects to /passport if already logged in
function PublicRoute({ children }) {
  const { session, loading } = useAuth()
  if (loading) return null
  return session ? <Navigate to="/passport" replace /> : children
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public: sign-up / sign-in */}
          <Route path="/" element={
            <PublicRoute><AuthPage /></PublicRoute>
          } />

          {/* Supabase redirects here after email verification or magic link click */}
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Protected: passport dashboard */}
          <Route path="/passport" element={
            <ProtectedRoute><PassportPage /></ProtectedRoute>
          } />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
