import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/i18n/LanguageContext'

/**
 * Waits for auth state to resolve before deciding to redirect — redirecting
 * while `loading` is still true would bounce an already-logged-in visitor to
 * /login just because the session hadn't loaded yet.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const { t } = useLanguage()
  const location = useLocation()

  if (loading) {
    return <p className="p-6 text-text-secondary">{t.common.loading}</p>
  }

  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />
  }

  return <>{children}</>
}
