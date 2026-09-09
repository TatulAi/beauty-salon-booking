import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-24 text-center">
      <h1 className="text-2xl font-semibold text-text">404</h1>
      <Link to="/" className="text-accent">
        Back home
      </Link>
    </div>
  )
}
