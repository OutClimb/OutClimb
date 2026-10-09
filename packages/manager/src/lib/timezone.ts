import { TZDate } from '@date-fns/tz'
import { format } from 'date-fns'

// The backend always operates in Central Time, so all dates are entered and displayed in it
// regardless of the browser's timezone.
export const TIMEZONE = 'America/Chicago'

export function formatInTimezone(ms: number, formatStr: string): string {
  return format(new TZDate(ms, TIMEZONE), formatStr)
}

export function formatDateTime(ms: number): string {
  return formatInTimezone(ms, "EEEE, MMMM d, yyyy 'at' h:mm aa 'CT'")
}

// Parses a `yyyy-MM-dd` or `yyyy-MM-ddTHH:mm` value as a wall-clock time in TIMEZONE.
export function parseInTimezone(value: string): number | null {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/)
  if (!match) return null

  const [, year, month, day, hours = '0', minutes = '0'] = match
  const ms = new TZDate(+year, +month - 1, +day, +hours, +minutes, TIMEZONE).getTime()
  return isNaN(ms) ? null : ms
}
