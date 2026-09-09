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
  const [pending, setPending] = useState<'google' | 'github' | null>(null)

  async function handleOAuth(provider: 'google' | 'github') {
    setPending(provider)
    const supabase = await getSupabase()
    const callbackUrl = new URL('/auth/callback', window.location.origin)
    callbackUrl.searchParams.set('redirect', redirectPath)
    // Full-page redirect to the provider's consent screen — Supabase brings
    // the visitor back to /auth/callback with the session in the URL.
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: callbackUrl.toString() },
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-center text-sm text-text-secondary">{t.auth.orContinueWith}</p>
      <Button
        type="button"
        variant="secondary"
        disabled={pending !== null}
        onClick={() => handleOAuth('google')}
      >
        {t.auth.continueWithGoogle}
      </Button>
      <Button
        type="button"
        variant="secondary"
        disabled={pending !== null}
        onClick={() => handleOAuth('github')}
      >
        {t.auth.continueWithGithub}
      </Button>
    </div>
  )
}
