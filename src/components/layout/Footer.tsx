import { useLanguage } from '@/i18n/LanguageContext'

export function Footer() {
  const { t } = useLanguage()

  return (
    <footer className="border-t border-border px-6 py-6 text-center font-mono text-xs text-text-secondary">
      &copy; {new Date().getFullYear()} {t.brand.name}
    </footer>
  )
}
