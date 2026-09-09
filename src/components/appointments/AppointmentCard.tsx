import { useState } from 'react'
import { useLanguage } from '@/i18n/LanguageContext'
import { getSupabase } from '@/lib/supabase'
import { formatPrice } from '@/lib/time'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { Appointment } from '@/types/database'

const STATUS_KEY = {
  confirmed: 'statusConfirmed',
  cancelled: 'statusCancelled',
  completed: 'statusCompleted',
  no_show: 'statusNoShow',
} as const

interface AppointmentCardProps {
  appointment: Appointment
  timezone: string
  locale: string
  onCancelled: (id: string) => void
}

export function AppointmentCard({ appointment, timezone, locale, onCancelled }: AppointmentCardProps) {
  const { t } = useLanguage()
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canCancel = appointment.status === 'confirmed' && new Date(appointment.start_time) > new Date()

  async function handleCancel() {
    setCancelling(true)
    setError(null)
    try {
      const supabase = await getSupabase()
      const { error: rpcError } = await supabase.rpc('cancel_appointment', {
        p_appointment_id: appointment.id,
      })
      if (rpcError) {
        setError(t.booking.genericError)
        return
      }
      onCancelled(appointment.id)
    } finally {
      setCancelling(false)
    }
  }

  const dateFormatter = new Intl.DateTimeFormat(locale, {
    timeZone: timezone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <Card className="flex flex-col gap-1">
      <p className="font-medium text-text">{appointment.services?.name}</p>
      <p className="text-sm text-text-secondary">
        {t.appointments.with} {appointment.staff?.display_name} &middot;{' '}
        {dateFormatter.format(new Date(appointment.start_time))}
      </p>
      <p className="text-sm text-text-secondary">
        {formatPrice(appointment.price_cents, locale)} &middot; {t.appointments[STATUS_KEY[appointment.status]]}
      </p>
      {error && <p className="text-sm text-danger">{error}</p>}
      {canCancel && (
        <Button variant="danger" onClick={handleCancel} disabled={cancelling} className="mt-2 w-fit">
          {cancelling ? t.appointments.cancelling : t.appointments.cancelButton}
        </Button>
      )}
    </Card>
  )
}
