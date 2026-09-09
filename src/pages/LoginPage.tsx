import { useSearchParams } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { LoginForm } from '@/components/auth/LoginForm'
import { useLanguage } from '@/i18n/LanguageContext'

export function LoginPage() {
  const [searchParams] = useSearchParams()
  const { t } = useLanguage()
  const redirectPath = searchParams.get('redirect') ?? '/'

  return (
    <div className="px-6 py-10">
      <LoginForm redirectPath={redirectPath} />
      <p className="mt-4 text-center text-sm text-text-secondary">
        {t.auth.noAccount}{' '}
        <Link
          to={`/signup?redirect=${encodeURIComponent(redirectPath)}`}
          className="font-medium text-accent"
        >
          {t.nav.signup}
        </Link>
      </p>
    </div>
  )
}
