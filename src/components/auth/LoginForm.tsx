import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSupabase } from '@/lib/supabase'
import { useLanguage } from '@/i18n/LanguageContext'
import { SignInCard2 } from '@/components/ui/sign-in-card-2'

export function LoginForm({ redirectPath }: { redirectPath: string }) {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit({ email, password }: { email: string; password: string }) {
    setError(null)
    setLoading(true)
    try {
      const supabase = await getSupabase()
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) {
        setError(t.auth.invalidCredentials)
        return
      }
      navigate(redirectPath)
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleSignIn() {
    setLoading(true)
    const supabase = await getSupabase()
    const callbackUrl = new URL('/auth/callback', window.location.origin)
    callbackUrl.searchParams.set('redirect', redirectPath)
    // Full-page redirect to Google's consent screen — Supabase brings the
    // visitor back to /auth/callback with the session in the URL.
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callbackUrl.toString() },
    })
  }

  return (
    <SignInCard2
      onSubmit={handleSubmit}
      onGoogleSignIn={handleGoogleSignIn}
      loading={loading}
      error={error}
      signupTo={`/signup?redirect=${encodeURIComponent(redirectPath)}`}
    />
  )
}
