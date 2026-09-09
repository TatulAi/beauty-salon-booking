import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/i18n/LanguageContext'
import { getSupabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { ServicePicker } from '@/components/booking/ServicePicker'
import { StaffPicker } from '@/components/booking/StaffPicker'
import { DatePicker } from '@/components/booking/DatePicker'
import { TimeSlotGrid } from '@/components/booking/TimeSlotGrid'
import { BookingSummary } from '@/components/booking/BookingSummary'
import { PENDING_BOOKING_KEY, type PendingBooking } from '@/types/booking'
import type { Appointment, Service, Staff } from '@/types/database'

type Step = 'service' | 'staff' | 'date' | 'confirm' | 'success'

export function BookingPage() {
  const { user } = useAuth()
  const { t } = useLanguage()

  const [timezone, setTimezone] = useState<string | null>(null)
  const [step, setStep] = useState<Step>('service')
  const [service, setService] = useState<Service | null>(null)
  const [staff, setStaff] = useState<Staff | null>(null)
  const [dateKey, setDateKey] = useState<string | null>(null)
  const [startTime, setStartTime] = useState<string | null>(null)
  const [confirmedAppointment, setConfirmedAppointment] = useState<Appointment | null>(null)
  const [restoredFromLogin, setRestoredFromLogin] = useState(false)
  const [dateStepError, setDateStepError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getSupabase()
      .then((supabase) => supabase.from('shop_settings').select('timezone').single())
      .then(({ data }) => {
        if (!cancelled && data) setTimezone(data.timezone)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // After a login/signup redirect, restore whatever the visitor had picked
  // before we sent them off to authenticate, and re-show the confirm step —
  // never auto-book without this explicit re-confirmation.
  useEffect(() => {
    if (!user || restoredFromLogin) return
    const raw = sessionStorage.getItem(PENDING_BOOKING_KEY)
    if (!raw) return
    try {
      const pending = JSON.parse(raw) as PendingBooking
      setService(pending.service)
      setStaff(pending.staff)
      setDateKey(pending.date)
      setStartTime(pending.startTime)
      setStep('confirm')
    } catch {
      // malformed/stale entry — ignore
    } finally {
      sessionStorage.removeItem(PENDING_BOOKING_KEY)
      setRestoredFromLogin(true)
    }
  }, [user, restoredFromLogin])

  if (!timezone) {
    return <p className="p-6 text-text-secondary">{t.common.loading}</p>
  }

  if (step === 'success' && confirmedAppointment) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold text-text">{t.booking.successHeading}</h1>
        <p className="text-text-secondary">{t.booking.successBody}</p>
        <Link to="/my-appointments">
          <Button>{t.booking.viewMyAppointments}</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <ol className="mb-8 flex gap-4 text-sm text-text-secondary">
        <StepLabel active={step === 'service'} label={t.booking.stepService} />
        <StepLabel active={step === 'staff'} label={t.booking.stepStaff} />
        <StepLabel active={step === 'date'} label={t.booking.stepDate} />
        <StepLabel active={step === 'confirm'} label={t.booking.stepConfirm} />
      </ol>

      {step === 'service' && (
        <ServicePicker
          onSelect={(s) => {
            setService(s)
            setStep('staff')
          }}
        />
      )}

      {step === 'staff' && service && (
        <StaffPicker
          serviceId={service.id}
          onBack={() => setStep('service')}
          onSelect={(s) => {
            setStaff(s)
            setStep('date')
          }}
        />
      )}

      {step === 'date' && service && staff && (
        <div className="flex flex-col gap-4">
          <Button variant="secondary" onClick={() => setStep('staff')} className="w-fit">
            {t.booking.back}
          </Button>
          <h2 className="text-lg font-semibold text-text">{t.booking.chooseDate}</h2>
          {dateStepError && <p className="text-sm text-danger">{dateStepError}</p>}
          <DatePicker
            timezone={timezone}
            selectedDateKey={dateKey}
            onSelect={(d) => {
              setDateStepError(null)
              setDateKey(d)
            }}
          />
          {dateKey && (
            <>
              <h2 className="text-lg font-semibold text-text">{t.booking.chooseTime}</h2>
              <TimeSlotGrid
                staffId={staff.id}
                serviceId={service.id}
                dateKey={dateKey}
                timezone={timezone}
                onSelect={(iso) => {
                  setDateStepError(null)
                  setStartTime(iso)
                  setStep('confirm')
                }}
              />
            </>
          )}
        </div>
      )}

      {step === 'confirm' && service && staff && dateKey && startTime && (
        <BookingSummary
          service={service}
          staff={staff}
          dateKey={dateKey}
          startTime={startTime}
          timezone={timezone}
          onBack={() => setStep('date')}
          onSlotTaken={(message) => {
            setStartTime(null)
            setDateStepError(message)
            setStep('date')
          }}
          onSuccess={(appointment) => {
            setConfirmedAppointment(appointment)
            setStep('success')
          }}
        />
      )}
    </div>
  )
}

function StepLabel({ active, label }: { active: boolean; label: string }) {
  return <li className={active ? 'font-semibold text-accent' : ''}>{label}</li>
}
