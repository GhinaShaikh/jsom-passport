import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, getPassport } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined) // undefined = loading
  const [user, setUser] = useState(null)
  const [passport, setPassport] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session on mount
    supabase.auth.getSession().then(({ data }) => {
      const s = data?.session ?? null
      setSession(s)
      setUser(s?.user ?? null)
      if (s?.user) loadPassport(s.user.id)
      else setLoading(false)
    })

    // Listen for auth state changes (magic link callback, sign out, etc.)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setUser(s?.user ?? null)
      if (s?.user) loadPassport(s.user.id)
      else { setPassport(null); setLoading(false) }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function loadPassport(userId) {
    setLoading(true)
    const { data } = await getPassport(userId)
    setPassport(data)
    setLoading(false)
  }

  function refreshPassport(updated) {
    setPassport(updated)
  }

  return (
    <AuthContext.Provider value={{ session, user, passport, loading, refreshPassport }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
