import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase'
import { useLanguage } from '@/i18n/LanguageContext'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { Staff } from '@/types/database'

interface StaffPickerProps {
  serviceId: string
  onSelect: (staff: Staff) => void
  onBack: () => void
}

export function StaffPicker({ serviceId, onSelect, onBack }: StaffPickerProps) {
  const { t } = useLanguage()
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    getSupabase()
      .then((supabase) =>
        supabase.from('staff_services').select('staff(*)').eq('service_id', serviceId)
      )
      .then(({ data }) => {
        if (cancelled) return
        const rows = (data ?? []) as unknown as { staff: Staff }[]
        setStaff(rows.map((row) => row.staff).filter((s): s is Staff => s !== null))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [serviceId])

  if (loading) return <p className="text-text-secondary">{t.common.loading}</p>

  return (
    <div className="flex flex-col gap-4">
      <Button variant="secondary" onClick={onBack} className="w-fit">
        {t.booking.back}
      </Button>
      <h2 className="text-lg font-semibold text-text">{t.booking.chooseStaff}</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {staff.map((member) => (
          <Card
            key={member.id}
            className="cursor-pointer hover:border-accent"
            onClick={() => onSelect(member)}
          >
            <p className="font-medium text-text">{member.display_name}</p>
            {member.bio && <p className="text-sm text-text-secondary">{member.bio}</p>}
          </Card>
        ))}
      </div>
    </div>
  )
}
