import { useSearchParams } from 'react-router-dom'
import { LoginForm } from '@/components/auth/LoginForm'

export function LoginPage() {
  const [searchParams] = useSearchParams()
  const redirectPath = searchParams.get('redirect') ?? '/'

  // The sign-in card carries its own "Sign up" link and layout wrapper.
  return <LoginForm redirectPath={redirectPath} />
}
