import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { getSupabase } from '@/lib/supabase'

interface AuthContextValue {
  user: User | null
  session: Session | null
  loading: boolean
  /** Set if the Supabase client failed to initialize — almost always missing/wrong env vars. */
  initError: string | null
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [initError, setInitError] = useState<string | null>(null)

  useEffect(() => {
    let unsubscribe: (() => void) | undefined
    let cancelled = false

    getSupabase()
      .then(async (supabase) => {
        const { data } = await supabase.auth.getSession()
        if (cancelled) return
        setSession(data.session)
        setLoading(false)

        const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
          setSession(newSession)
        })
        unsubscribe = () => sub.subscription.unsubscribe()
      })
      .catch((err: unknown) => {
        // Without this, a missing/wrong VITE_SUPABASE_URL/ANON_KEY throws
        // inside createClient(), the rejection has no handler, and `loading`
        // stays true forever — every page gated on it (ProtectedRoute,
        // BookingPage) shows a spinner indefinitely with no clue why.
        if (cancelled) return
        console.error('Failed to initialize Supabase client — check VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY:', err)
        setInitError(err instanceof Error ? err.message : String(err))
        setLoading(false)
      })

    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [])

  async function signOut() {
    const supabase = await getSupabase()
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user: session?.user ?? null, session, loading, initError, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
