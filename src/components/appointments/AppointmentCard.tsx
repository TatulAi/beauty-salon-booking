import { useState } from 'react'
import { useLanguage } from '@/i18n/LanguageContext'
import { getSupabase } from '@/lib/supabase'
import { formatPrice } from '@/lib/time'
import { Ticket, TicketDivider } from '@/components/ui/Ticket'
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
  const isCancelled = appointment.status === 'cancelled'

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
    <Ticket muted={isCancelled} className="pt-8">
      <p className="font-mono text-xs tracking-wide text-text-secondary">
        {dateFormatter.format(new Date(appointment.start_time))}
      </p>
      <p className="font-display mt-1 text-xl text-text">{appointment.services?.name}</p>
      <p className="mt-1 text-sm text-text-secondary">
        {t.appointments.with} {appointment.staff?.display_name}
      </p>

      <TicketDivider />

      <div className="flex items-center justify-between">
        <p className={`font-mono text-lg ${isCancelled ? 'text-text-secondary' : 'text-signature'}`}>
          {formatPrice(appointment.price_cents, locale)}
        </p>
        <p className="text-xs tracking-wide text-text-secondary uppercase">
          {t.appointments[STATUS_KEY[appointment.status]]}
        </p>
      </div>

      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      {canCancel && (
        <Button variant="danger" onClick={handleCancel} disabled={cancelling} className="mt-3 w-fit">
          {cancelling ? t.appointments.cancelling : t.appointments.cancelButton}
        </Button>
      )}
    </Ticket>
  )
}
