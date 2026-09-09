import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/i18n/LanguageContext'
import { getSupabase } from '@/lib/supabase'
import { formatDateKey, formatPrice, formatShopTime } from '@/lib/time'
import { Button } from '@/components/ui/Button'
import { Ticket, TicketDivider } from '@/components/ui/Ticket'
import { PENDING_BOOKING_KEY, type PendingBooking } from '@/types/booking'
import type { Appointment, Service, Staff } from '@/types/database'

interface BookingSummaryProps {
  service: Service
  staff: Staff
  dateKey: string
  startTime: string
  timezone: string
  onBack: () => void
  /**
   * Called when the server rejects the slot as already taken. This
   * component is about to unmount (caller switches back to the date/time
   * step), so the message is passed up rather than kept in local state —
   * local state would just die with the unmount and never be seen.
   */
  onSlotTaken: (message: string) => void
  onSuccess: (appointment: Appointment) => void
}

export function BookingSummary({
  service,
  staff,
  dateKey,
  startTime,
  timezone,
  onBack,
  onSlotTaken,
  onSuccess,
}: BookingSummaryProps) {
  const { user } = useAuth()
  const { t, locale } = useLanguage()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function stashAndRedirectToLogin() {
    const pending: PendingBooking = { service, staff, date: dateKey, startTime }
    sessionStorage.setItem(PENDING_BOOKING_KEY, JSON.stringify(pending))
    navigate(`/login?redirect=${encodeURIComponent('/book')}`)
  }

  async function handleConfirm() {
    if (!user) {
      stashAndRedirectToLogin()
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const supabase = await getSupabase()
      const { data, error: rpcError } = await supabase.rpc('create_appointment', {
        p_staff_id: staff.id,
        p_service_id: service.id,
        p_start_time: startTime,
      })

      if (rpcError) {
        if (rpcError.message.includes('SLOT_TAKEN')) {
          onSlotTaken(t.booking.slotTakenError)
        } else {
          setError(t.booking.genericError)
        }
        return
      }

      onSuccess(data as Appointment)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Button variant="secondary" onClick={onBack} className="w-fit">
        {t.booking.back}
      </Button>
      <h2 className="font-display text-2xl text-text">{t.booking.confirmHeading}</h2>

      <Ticket className="w-full max-w-sm pt-8">
        <p className="font-mono text-xs tracking-wide text-text-secondary">
          {formatDateKey(dateKey, timezone, locale)} &middot; {formatShopTime(startTime, timezone, locale)}
        </p>
        <p className="font-display mt-1 text-xl text-text">{service.name}</p>
        <p className="mt-1 text-sm text-text-secondary">
          {t.appointments.with} {staff.display_name}
        </p>
        <TicketDivider />
        <p className="font-mono text-lg text-signature-text">{formatPrice(service.price_cents, locale)}</p>
      </Ticket>

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button onClick={handleConfirm} disabled={submitting} className="w-fit">
        {submitting ? t.booking.booking : user ? t.booking.confirmButton : t.booking.loginToBook}
      </Button>
    </div>
  )
}
