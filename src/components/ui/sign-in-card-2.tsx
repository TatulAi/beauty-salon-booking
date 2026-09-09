import { useState, type ComponentProps, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/i18n/LanguageContext'
import { Button } from '@/components/ui/Button'

/*
 * Adapted from the "sign-in-card-2" community component. The original is a
 * dark glassmorphic card leaning hard on framer-motion (3D mouse-tilt,
 * traveling light beams, pulsing glows). This project's design language is
 * the opposite — warm stone/sage, light-first, and deliberately still
 * ("Motion is a single restrained moment … nothing else in the app
 * animates", see CLAUDE.md). So the layout and structure are kept; the
 * motion library and background effects are dropped, and every colour is a
 * design token. CSS transitions only.
 */

function Input({ className, type, ...props }: ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'h-10 w-full min-w-0 rounded-md border border-border bg-surface px-3 py-1 text-sm text-text',
        'placeholder:text-text-secondary transition-colors outline-none',
        'focus-visible:border-accent',
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        'aria-invalid:border-danger',
        className,
      )}
      {...props}
    />
  )
}

export interface SignInCard2Props {
  /** Called with the entered credentials when the form is submitted. */
  onSubmit: (values: { email: string; password: string }) => void
  /** Called when the "Continue with Google" button is pressed. */
  onGoogleSignIn: () => void
  /** Disables inputs and buttons while an auth request is in flight. */
  loading?: boolean
  /** Error message to show under the password field. */
  error?: string | null
  /** Router path for the "Sign up" link (may carry a `?redirect=`). */
  signupTo: string
}

export function SignInCard2({
  onSubmit,
  onGoogleSignIn,
  loading = false,
  error = null,
  signupTo,
}: SignInCard2Props) {
  const { t } = useLanguage()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (loading) return
    onSubmit({ email, password })
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface-raised p-6 shadow-sm sm:p-8">
        {/* Logo + header */}
        <div className="mb-6 flex flex-col items-center gap-1 text-center">
          <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-full border border-border">
            <span className="font-display text-lg font-medium text-text">P</span>
          </span>
          <h1 className="font-display text-xl text-text">{t.auth.welcomeBack}</h1>
          <p className="text-xs text-text-secondary">{t.auth.signInSubtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Email */}
          <div className="group relative flex items-center">
            <Mail className="pointer-events-none absolute left-3 h-4 w-4 text-text-secondary transition-colors group-focus-within:text-accent" />
            <Input
              type="email"
              required
              autoComplete="email"
              placeholder={t.auth.email}
              value={email}
              disabled={loading}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Password */}
          <div>
            <div className="group relative flex items-center">
              <Lock className="pointer-events-none absolute left-3 h-4 w-4 text-text-secondary transition-colors group-focus-within:text-accent" />
              <Input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder={t.auth.password}
                value={password}
                disabled={loading}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={error ? true : undefined}
                className="pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? t.auth.hidePassword : t.auth.showPassword}
                className="absolute right-2 flex h-7 w-7 items-center justify-center rounded text-text-secondary transition-colors hover:text-text"
              >
                {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
            </div>
            {error && <p className="mt-2 text-sm text-danger">{error}</p>}
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-1.5"
          >
            {loading ? (
              t.common.loading
            ) : (
              <>
                {t.auth.loginButton}
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </Button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs text-text-secondary">{t.auth.orShort}</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          {/* Google */}
          <Button
            type="button"
            variant="secondary"
            disabled={loading}
            onClick={onGoogleSignIn}
            className="flex w-full items-center justify-center gap-2"
          >
            <GoogleMark />
            {t.auth.continueWithGoogle}
          </Button>
        </form>

        {/* Sign up */}
        <p className="mt-6 text-center text-sm text-text-secondary">
          {t.auth.noAccount}{' '}
          <Link
            to={signupTo}
            className="font-medium text-accent underline-offset-4 hover:underline"
          >
            {t.nav.signup}
          </Link>
        </p>
      </div>
    </div>
  )
}

function GoogleMark() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09A6.6 6.6 0 0 1 5.49 12c0-.73.13-1.43.35-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  )
}
