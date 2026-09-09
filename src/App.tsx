import { Outlet } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { useAuth } from '@/context/AuthContext'

export function App() {
  const { initError } = useAuth()

  return (
    <div className="flex min-h-screen flex-col">
      {initError && (
        <p className="bg-danger px-6 py-2 text-center text-sm text-white">
          Could not connect to the backend — check VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.
        </p>
      )}
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
