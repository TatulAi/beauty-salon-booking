import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/i18n/LanguageContext'

/**
 * The Supabase client (created once in AuthContext, mounted above the
 * router) auto-detects the OAuth code/token in this page's URL and
 * exchanges it for a session on its own — this page just waits for that to
 * finish (AuthContext's `loading` flips to false once auth state settles)
 * and then continues to wherever the visitor was headed.
 *
 * NOT YET VERIFIED against a live Supabase project — the exact timing of
 * the automatic session exchange vs. AuthContext's initial getSession() call
 * should be confirmed once real Google/GitHub OAuth is wired up.
 */
export function AuthCallbackPage() {
  const { loading } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    if (loading) return
    const redirectPath = searchParams.get('redirect') ?? '/'
    navigate(redirectPath, { replace: true })
  }, [loading, navigate, searchParams])

  return <p className="p-6 text-center text-text-secondary">{t.common.loading}</p>
}
