import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/theme/ThemeContext'
import { useLanguage } from '@/i18n/LanguageContext'

/**
 * Light/dark switch for the header. Binary: it flips between light and dark
 * based on what's currently showing, so the first click also opts out of
 * following the OS. The icon shows the mode you'd switch *to*.
 */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const { resolvedTheme, toggleTheme } = useTheme()
  const { t } = useLanguage()

  const goingToDark = resolvedTheme === 'light'
  const label = goingToDark ? t.theme.switchToDark : t.theme.switchToLight

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={`flex h-[26px] w-[26px] items-center justify-center rounded border border-border bg-surface text-text-secondary transition-colors hover:text-accent ${className}`}
    >
      {goingToDark ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
    </button>
  )
}
