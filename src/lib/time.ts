/**
 * All of this exists because `get_available_slots(p_date date)` needs the
 * shop's own calendar date, not the visitor's. `new Date().toISOString()`
 * gives the UTC date, which is wrong near midnight in any other timezone —
 * always go through Intl.DateTimeFormat with the shop's timeZone instead.
 */

/** Shop-local calendar date as YYYY-MM-DD, safe to pass to a `date` param. */
export function shopLocalDateKey(date: Date, timeZone: string): string {
  // en-CA's built-in format happens to be YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', { timeZone }).format(date)
}

/**
 * Next `count` shop-local calendar dates starting today, as YYYY-MM-DD keys.
 *
 * Deliberately does NOT add `i * 24h` to a real instant and re-derive the
 * shop-local date from that — across a DST transition in `timeZone`, two
 * consecutive 24h-apart instants can land on the same calendar date (fall
 * back) or skip one (spring forward), producing a duplicate or missing key.
 * Instead, get today's key once, then advance pure calendar numbers via
 * Date.UTC (which has no DST) and read them back with toISOString — no
 * further timezone conversion happens after the initial anchor.
 */
export function nextShopLocalDates(count: number, timeZone: string): string[] {
  const todayKey = shopLocalDateKey(new Date(), timeZone)
  const [year, month, day] = todayKey.split('-').map(Number)
  const anchorUtcMs = Date.UTC(year, month - 1, day)

  const dates: string[] = []
  for (let i = 0; i < count; i++) {
    dates.push(new Date(anchorUtcMs + i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10))
  }
  return dates
}

/** Formats an ISO timestamptz in the shop's timezone, e.g. "9:00 AM". */
export function formatShopTime(iso: string, timeZone: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso))
}

/** Formats a YYYY-MM-DD date key for display, e.g. "Mon, Sep 8". */
export function formatDateKey(dateKey: string, timeZone: string, locale: string): string {
  // Construct at shop-local noon to avoid any edge-case rollover when
  // re-formatting a date-only key back through a timezone-aware formatter.
  const d = new Date(`${dateKey}T12:00:00`)
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(d)
}

export function formatPrice(cents: number, locale: string, currency = 'EUR'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(cents / 100)
}
