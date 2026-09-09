import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSupabase } from '@/lib/supabase'
import { useLanguage } from '@/i18n/LanguageContext'
import { Button } from '@/components/ui/Button'
import { OAuthButtons } from './OAuthButtons'

export function LoginForm({ redirectPath }: { redirectPath: string }) {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const supabase = await getSupabase()
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) {
        setError(t.auth.invalidCredentials)
        return
      }
      navigate(redirectPath)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-4">
      <h1 className="font-display text-2xl text-text">{t.auth.loginHeading}</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          required
          placeholder={t.auth.email}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-md border border-border bg-surface px-3 py-2 text-text placeholder:text-text-secondary"
        />
        <input
          type="password"
          required
          placeholder={t.auth.password}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-md border border-border bg-surface px-3 py-2 text-text placeholder:text-text-secondary"
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" disabled={submitting}>
          {t.auth.loginButton}
        </Button>
      </form>

      <OAuthButtons redirectPath={redirectPath} />
    </div>
  )
}
