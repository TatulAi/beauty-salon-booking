import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/i18n/LanguageContext'
import { getSupabase } from '@/lib/supabase'
import { formatDateKey, formatPrice, formatShopTime } from '@/lib/time'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
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
      <h2 className="text-lg font-semibold text-text">{t.booking.confirmHeading}</h2>
      <Card className="flex flex-col gap-2">
        <Row label={t.booking.confirmService} value={service.name} />
        <Row label={t.booking.confirmStaff} value={staff.display_name} />
        <Row label={t.booking.confirmDate} value={formatDateKey(dateKey, timezone, locale)} />
        <Row label={t.booking.confirmTime} value={formatShopTime(startTime, timezone, locale)} />
        <Row label={t.booking.confirmPrice} value={formatPrice(service.price_cents, locale)} />
      </Card>

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button onClick={handleConfirm} disabled={submitting}>
        {submitting ? t.booking.booking : user ? t.booking.confirmButton : t.booking.loginToBook}
      </Button>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-text-secondary">{label}</span>
      <span className="font-medium text-text">{value}</span>
    </div>
  )
}
