import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useLanguage, type Locale } from '@/i18n/LanguageContext'
import { Button } from '@/components/ui/Button'

export function Header() {
  const { user, signOut } = useAuth()
  const { t, locale, setLocale } = useLanguage()
  const navigate = useNavigate()

  async function handleLogout() {
    await signOut()
    navigate('/')
  }

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-6 py-4">
      <Link to="/" className="text-lg font-semibold text-text">
        {t.home.heading}
      </Link>

      <nav className="flex flex-wrap items-center gap-4 text-sm">
        <Link to="/book" className="text-text hover:text-accent">
          {t.nav.book}
        </Link>

        {user ? (
          <>
            <Link to="/my-appointments" className="text-text hover:text-accent">
              {t.nav.myAppointments}
            </Link>
            <Button variant="secondary" onClick={handleLogout}>
              {t.nav.logout}
            </Button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-text hover:text-accent">
              {t.nav.login}
            </Link>
            <Link to="/signup">
              <Button variant="primary">{t.nav.signup}</Button>
            </Link>
          </>
        )}

        <select
          value={locale}
          onChange={(e) => setLocale(e.target.value as Locale)}
          className="rounded border border-border bg-surface px-2 py-1 text-text"
          aria-label="Language"
        >
          <option value="sk">SK</option>
          <option value="en">EN</option>
        </select>
      </nav>
    </header>
  )
}
