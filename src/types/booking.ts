import type { Service, Staff } from './database'

/** Wizard selection state, stashed to sessionStorage across a login redirect. */
export interface PendingBooking {
  service: Service
  staff: Staff
  /** shop-local calendar date, YYYY-MM-DD */
  date: string
  /** ISO timestamptz string returned by get_available_slots */
  startTime: string
}

export const PENDING_BOOKING_KEY = 'pending-booking'
