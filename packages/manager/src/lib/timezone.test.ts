import { describe, expect, it } from 'vitest'
import { formatDateTime, formatInTimezone, parseInTimezone } from '@/lib/timezone'

const CST_OFFSET_HOURS = 6
const CDT_OFFSET_HOURS = 5

describe('parseInTimezone', () => {
  it('reads wall-clock time as Central Time during standard time', () => {
    expect(parseInTimezone('2026-01-15T12:00')).toBe(Date.UTC(2026, 0, 15, 12 + CST_OFFSET_HOURS))
  })

  it('reads wall-clock time as Central Time during daylight time', () => {
    expect(parseInTimezone('2026-07-01T12:00')).toBe(Date.UTC(2026, 6, 1, 12 + CDT_OFFSET_HOURS))
  })

  it('treats a date without a time as midnight Central', () => {
    expect(parseInTimezone('2026-01-15')).toBe(Date.UTC(2026, 0, 15, CST_OFFSET_HOURS))
  })

  it('ignores surrounding whitespace', () => {
    expect(parseInTimezone('  2026-01-15  ')).toBe(parseInTimezone('2026-01-15'))
  })

  it.each(['', 'tomorrow', '2026-1-5', '2026-01-15T9:00', '2026-01-15 12:00', '2026-01-15T12:00:00'])(
    'returns null for malformed value %j',
    (value) => {
      expect(parseInTimezone(value)).toBeNull()
    },
  )
})

describe('formatInTimezone', () => {
  it('formats in Central Time regardless of the instant being UTC', () => {
    const lateEveningUtc = Date.UTC(2026, 0, 16, 3, 30)
    expect(formatInTimezone(lateEveningUtc, 'yyyy-MM-dd HH:mm')).toBe('2026-01-15 21:30')
  })

  it('round-trips with parseInTimezone', () => {
    const ms = parseInTimezone('2026-07-04T18:45')!
    expect(formatInTimezone(ms, "yyyy-MM-dd'T'HH:mm")).toBe('2026-07-04T18:45')
  })
})

describe('formatDateTime', () => {
  it('produces the long Central Time display format', () => {
    expect(formatDateTime(Date.UTC(2026, 0, 15, 18, 0))).toBe('Thursday, January 15, 2026 at 12:00 PM CT')
  })
})
