import type { SupabaseClient } from '@supabase/supabase-js'

// Lazily loaded so the ~200KB @supabase/supabase-js bundle is only fetched
// once something actually needs it, not on every page load — same pattern
// as LVG-engineering's src/lib/supabase.js. Unlike that project, AuthContext
// needs this at boot to restore the session, so it awaits getSupabase()
// behind a `loading` gate rather than firing a request eagerly.
let clientPromise: Promise<SupabaseClient> | null = null

export function getSupabase(): Promise<SupabaseClient> {
  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js').then(({ createClient }) =>
      createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)
    )
  }
  return clientPromise
}
