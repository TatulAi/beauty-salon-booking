import { useEffect, useState } from 'react'
import { useLanguage } from '@/i18n/LanguageContext'
import { getSupabase } from '@/lib/supabase'
import { AppointmentCard } from '@/components/appointments/AppointmentCard'
import type { Appointment } from '@/types/database'

export function MyAppointmentsPage() {
  const { t, locale } = useLanguage()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [timezone, setTimezone] = useState<string>('UTC')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    getSupabase().then(async (supabase) => {
      const [{ data: settings }, { data: rows }] = await Promise.all([
        supabase.from('shop_settings').select('timezone').single(),
        supabase
          .from('appointments')
          .select('*, services(name), staff(display_name)')
          .order('start_time', { ascending: false }),
      ])
      if (cancelled) return
      if (settings) setTimezone(settings.timezone)
      setAppointments((rows ?? []) as Appointment[])
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [])

  function handleCancelled(id: string) {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'cancelled' as const } : a))
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="font-display mb-6 text-3xl text-text">{t.appointments.heading}</h1>

      {loading && <p className="text-text-secondary">{t.common.loading}</p>}

      {!loading && appointments.length === 0 && (
        <p className="text-text-secondary">{t.appointments.empty}</p>
      )}

      <div className="flex flex-col gap-3">
        {appointments.map((appointment) => (
          <AppointmentCard
            key={appointment.id}
            appointment={appointment}
            timezone={timezone}
            locale={locale}
            onCancelled={handleCancelled}
          />
        ))}
      </div>
    </div>
  )
}
