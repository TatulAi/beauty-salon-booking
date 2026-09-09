import { useState } from 'react'
import { getSupabase } from '@/lib/supabase'
import { useLanguage } from '@/i18n/LanguageContext'
import { Button } from '@/components/ui/Button'

interface OAuthButtonsProps {
  /** Path to return to after a successful login, e.g. "/book". */
  redirectPath: string
}

export function OAuthButtons({ redirectPath }: OAuthButtonsProps) {
  const { t } = useLanguage()
  const [pending, setPending] = useState(false)

  async function handleGoogleOAuth() {
    setPending(true)
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
    <div className="flex flex-col gap-2">
      <p className="text-center text-sm text-text-secondary">{t.auth.orContinueWith}</p>
      <Button type="button" variant="secondary" disabled={pending} onClick={handleGoogleOAuth}>
        {t.auth.continueWithGoogle}
      </Button>
    </div>
  )
}
