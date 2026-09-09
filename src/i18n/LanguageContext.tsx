import { createContext, useContext, useState, type ReactNode } from 'react'
import { en } from './en'
import { sk } from './sk'
import type { Translations } from './types'

export type Locale = 'en' | 'sk'

const LOCALES: Record<Locale, Translations> = { en, sk }
const STORAGE_KEY = 'beauty-salon-locale'

interface LanguageContextValue {
  locale: Locale
  t: Translations
  setLocale: (locale: Locale) => void
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

function getInitialLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'en' || stored === 'sk') return stored
  } catch {
    // localStorage unavailable (private mode, etc.) — fall through to default
  }
  return 'sk'
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale)

  function setLocale(next: Locale) {
    setLocaleState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // ignore — persistence is a nice-to-have, not required for correctness
    }
  }

  return (
    <LanguageContext.Provider value={{ locale, t: LOCALES[locale], setLocale }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
