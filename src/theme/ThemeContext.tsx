import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

/**
 * Theme handling, same shape as LanguageContext.
 *
 * - `'system'` (the default) applies no `data-theme` attribute, so the CSS
 *   `@media (prefers-color-scheme: dark)` rule decides.
 * - `'light'` / `'dark'` set `data-theme` on <html>, which the token
 *   cascade in index.css treats as an explicit override.
 *
 * The choice is persisted to localStorage and re-applied before first paint
 * by the inline script in index.html (keep STORAGE_KEY + the attribute name
 * in sync with that script).
 */
export type Theme = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

const STORAGE_KEY = 'beauty-salon-theme'

interface ThemeContextValue {
  /** The user's setting, including 'system'. */
  theme: Theme
  /** What 'system' currently resolves to — use this to pick an icon. */
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
  /** Flip between light and dark based on what's showing now. */
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  } catch {
    // localStorage unavailable (private mode, etc.) — fall through to default
  }
  return 'system'
}

function systemPrefersDark(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  )
}

// Keep the mobile browser chrome in step with the page background.
const THEME_COLOR: Record<ResolvedTheme, string> = {
  light: '#ddd5d0',
  dark: '#1c2624',
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme)
  const [systemDark, setSystemDark] = useState<boolean>(systemPrefersDark)

  // Track the OS setting so `resolvedTheme` stays correct while on 'system'.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const resolvedTheme: ResolvedTheme =
    theme === 'system' ? (systemDark ? 'dark' : 'light') : theme

  // Apply the setting to <html> and the theme-color meta.
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') {
      delete root.dataset.theme
    } else {
      root.dataset.theme = theme
    }
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', THEME_COLOR[resolvedTheme])
  }, [theme, resolvedTheme])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // ignore — persistence is a nice-to-have, not required for correctness
    }
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }, [resolvedTheme, setTheme])

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme, toggleTheme }),
    [theme, resolvedTheme, setTheme, toggleTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
