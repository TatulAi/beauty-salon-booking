export type ServiceCategory = 'men' | 'women' | 'unisex'
export type AppointmentStatus = 'confirmed' | 'cancelled' | 'completed' | 'no_show'

export interface Service {
  id: string
  name: string
  category: ServiceCategory
  duration_minutes: number
  buffer_minutes: number
  price_cents: number
  is_active: boolean
}

export interface Staff {
  id: string
  user_id: string | null
  display_name: string
  bio: string | null
  photo_url: string | null
  is_owner: boolean
  is_active: boolean
}

export interface Appointment {
  id: string
  staff_id: string
  service_id: string
  client_id: string
  start_time: string
  end_time: string
  duration_minutes: number
  buffer_minutes: number
  price_cents: number
  status: AppointmentStatus
  notes: string | null
  created_at: string
  cancelled_at: string | null
  // present only when selected via a join, e.g. `.select('*, services(name), staff(display_name)')`
  services?: Pick<Service, 'name'>
  staff?: Pick<Staff, 'display_name'>
}

export interface ShopSettings {
  shop_name: string
  timezone: string
  slot_granularity_minutes: number
  lead_time_minutes: number
}

export interface Profile {
  id: string
  full_name: string | null
  phone: string | null
  avatar_url: string | null
}
