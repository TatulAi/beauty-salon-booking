import { Link, useSearchParams } from 'react-router-dom'
import { SignupForm } from '@/components/auth/SignupForm'
import { useLanguage } from '@/i18n/LanguageContext'

export function SignupPage() {
  const [searchParams] = useSearchParams()
  const { t } = useLanguage()
  const redirectPath = searchParams.get('redirect') ?? '/'

  return (
    <div className="px-6 py-10">
      <SignupForm redirectPath={redirectPath} />
      <p className="mt-4 text-center text-sm text-text-secondary">
        {t.auth.hasAccount}{' '}
        <Link
          to={`/login?redirect=${encodeURIComponent(redirectPath)}`}
          className="font-medium text-accent"
        >
          {t.nav.login}
        </Link>
      </p>
    </div>
  )
}
