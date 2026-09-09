import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase'

interface UseAvailableSlotsResult {
  slots: string[]
  loading: boolean
  error: string | null
}

/** Calls the get_available_slots RPC. dateKey must be a shop-local YYYY-MM-DD (see lib/time.ts). */
export function useAvailableSlots(
  staffId: string | null,
  serviceId: string | null,
  dateKey: string | null
): UseAvailableSlotsResult {
  const [slots, setSlots] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!staffId || !serviceId || !dateKey) {
      setSlots([])
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    getSupabase()
      .then((supabase) =>
        supabase.rpc('get_available_slots', {
          p_staff_id: staffId,
          p_service_id: serviceId,
          p_date: dateKey,
        })
      )
      .then(({ data, error: rpcError }) => {
        if (cancelled) return
        if (rpcError) {
          setError(rpcError.message)
          setSlots([])
        } else {
          setSlots((data ?? []).map((row: { slot_start: string }) => row.slot_start))
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [staffId, serviceId, dateKey])

  return { slots, loading, error }
}
