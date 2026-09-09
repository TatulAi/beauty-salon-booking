import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase'
import { useLanguage } from '@/i18n/LanguageContext'
import { formatPrice } from '@/lib/time'
import { Card } from '@/components/ui/Card'
import type { Service, ServiceCategory } from '@/types/database'

const CATEGORY_ORDER: ServiceCategory[] = ['unisex', 'women', 'men']

export function ServicePicker({ onSelect }: { onSelect: (service: Service) => void }) {
  const { t, locale } = useLanguage()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    getSupabase()
      .then((supabase) => supabase.from('services').select('*').eq('is_active', true))
      .then(({ data }) => {
        if (!cancelled) setServices(data ?? [])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) return <p className="text-text-secondary">{t.common.loading}</p>

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-semibold text-text">{t.booking.chooseService}</h2>
      {CATEGORY_ORDER.map((category) => {
        const items = services.filter((s) => s.category === category)
        if (items.length === 0) return null
        return (
          <div key={category}>
            <h3 className="mb-2 text-sm font-medium uppercase tracking-wide text-text-secondary">
              {t.serviceCategory[category]}
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {items.map((service) => (
                <Card
                  key={service.id}
                  className="cursor-pointer hover:border-accent"
                  onClick={() => onSelect(service)}
                >
                  <p className="font-medium text-text">{service.name}</p>
                  <p className="text-sm text-text-secondary">
                    {service.duration_minutes} min &middot; {formatPrice(service.price_cents, locale)}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
