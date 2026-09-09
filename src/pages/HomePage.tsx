import { Link } from 'react-router-dom'
import { useLanguage } from '@/i18n/LanguageContext'
import { Button } from '@/components/ui/Button'

export function HomePage() {
  const { t } = useLanguage()

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-6 py-24 text-center">
      <h1 className="text-3xl font-semibold text-text">{t.home.heading}</h1>
      <p className="text-text-secondary">{t.home.subheading}</p>
      <Link to="/book">
        <Button>{t.home.cta}</Button>
      </Link>
    </div>
  )
}
