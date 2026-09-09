import { useLanguage } from '@/i18n/LanguageContext'
import { formatDateKey, nextShopLocalDates } from '@/lib/time'

interface DatePickerProps {
  timezone: string
  selectedDateKey: string | null
  onSelect: (dateKey: string) => void
}

const DAYS_AHEAD = 14

export function DatePicker({ timezone, selectedDateKey, onSelect }: DatePickerProps) {
  const { locale } = useLanguage()
  const dates = nextShopLocalDates(DAYS_AHEAD, timezone)

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {dates.map((dateKey) => (
        <button
          key={dateKey}
          type="button"
          onClick={() => onSelect(dateKey)}
          className={`shrink-0 rounded-lg border px-3 py-2 text-sm transition-colors ${
            dateKey === selectedDateKey
              ? 'border-accent bg-accent text-white'
              : 'border-border bg-surface text-text hover:border-accent'
          }`}
        >
          {formatDateKey(dateKey, timezone, locale)}
        </button>
      ))}
    </div>
  )
}
