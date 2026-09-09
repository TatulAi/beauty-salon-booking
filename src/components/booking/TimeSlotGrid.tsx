import { useLanguage } from '@/i18n/LanguageContext'
import { useAvailableSlots } from '@/hooks/useAvailableSlots'
import { formatShopTime } from '@/lib/time'

interface TimeSlotGridProps {
  staffId: string
  serviceId: string
  dateKey: string
  timezone: string
  onSelect: (isoStartTime: string) => void
}

export function TimeSlotGrid({ staffId, serviceId, dateKey, timezone, onSelect }: TimeSlotGridProps) {
  const { t, locale } = useLanguage()
  const { slots, loading, error } = useAvailableSlots(staffId, serviceId, dateKey)

  if (loading) return <p className="text-text-secondary">{t.common.loading}</p>
  if (error) return <p className="text-danger">{t.booking.genericError}</p>
  if (slots.length === 0) return <p className="text-text-secondary">{t.booking.noSlotsForDay}</p>

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {slots.map((iso) => (
        <button
          key={iso}
          type="button"
          onClick={() => onSelect(iso)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text hover:border-accent"
        >
          {formatShopTime(iso, timezone, locale)}
        </button>
      ))}
    </div>
  )
}
