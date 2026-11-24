import type { Location } from '@/types/location'

export interface LocationAutofillFields {
  startsAt: string
  endsAt: string
  locationName: string
  address: string
  city: string
  state: string
  zip: string
  excerpt: string
  body: string
}

type TextFieldName = 'locationName' | 'address' | 'city' | 'state' | 'zip' | 'excerpt' | 'body'
type LocationTextFieldName = 'name' | 'address' | 'city' | 'state' | 'zip' | 'excerpt' | 'longDescription'

const DATETIME_SEPARATOR = 'T'
const TWELVE_HOUR_CLOCK = 12
const MAX_HOUR_12 = 12
const MAX_HOUR_24 = 23
const MAX_MINUTE = 59
// The date picker defaults the time to midnight, so it is treated as not yet chosen.
const PICKER_DEFAULT_TIME = '00:00'
const TIME_PATTERN = /^(\d{1,2})(?::(\d{2}))?\s*([ap])?\.?m?\.?$/i

const textFieldMappings: Array<{ eventField: TextFieldName; locationField: LocationTextFieldName }> = [
  { eventField: 'locationName', locationField: 'name' },
  { eventField: 'address', locationField: 'address' },
  { eventField: 'city', locationField: 'city' },
  { eventField: 'state', locationField: 'state' },
  { eventField: 'zip', locationField: 'zip' },
  { eventField: 'excerpt', locationField: 'excerpt' },
  { eventField: 'body', locationField: 'longDescription' },
]

const optionalLocationFields: Array<LocationTextFieldName> = ['excerpt', 'longDescription']

// Converts free text such as "6:00 PM", "6pm" or "18:30" to `HH:mm`. Returns null when it can't be read.
export function parseTimeOfDay(text: string): string | null {
  const match = text.trim().match(TIME_PATTERN)
  if (!match) return null

  const [, hourText, minuteText = '0', meridiem] = match
  let hour = Number(hourText)
  const minute = Number(minuteText)
  if (minute > MAX_MINUTE) return null

  if (meridiem) {
    if (hour < 1 || hour > MAX_HOUR_12) return null
    const isPm = meridiem.toLowerCase() === 'p'
    hour = (hour % TWELVE_HOUR_CLOCK) + (isPm ? TWELVE_HOUR_CLOCK : 0)
  } else if (hour > MAX_HOUR_24) {
    return null
  }

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function splitDateTime(dateTime: string): { date: string; time: string } {
  const [date = '', time = ''] = dateTime.split(DATETIME_SEPARATOR)
  return { date, time }
}

function shouldOverwrite(currentValue: string, previousLocationValue: string | undefined): boolean {
  return currentValue === '' || currentValue === previousLocationValue
}

function applyTimeToDateTime(
  dateTime: string,
  fallbackDate: string,
  previousLocationTime: string,
  newLocationTime: string,
): string {
  const newTime = parseTimeOfDay(newLocationTime)
  if (newTime === null) return dateTime

  const { date, time } = splitDateTime(dateTime)
  const targetDate = date || fallbackDate
  if (!targetDate) return dateTime

  const previousTime = parseTimeOfDay(previousLocationTime)
  const isTimeReplaceable =
    time === '' || time === PICKER_DEFAULT_TIME || (previousTime !== null && time === previousTime)
  if (!isTimeReplaceable) return dateTime

  return `${targetDate}${DATETIME_SEPARATOR}${newTime}`
}

export function applyLocationToEvent<T extends LocationAutofillFields>(
  event: T,
  previousLocation: Location | undefined,
  newLocation: Location | undefined,
  defaultDate = '',
): T {
  if (!newLocation) return event

  const merged = { ...event }

  for (const { eventField, locationField } of textFieldMappings) {
    const newValue = newLocation[locationField]
    if (optionalLocationFields.includes(locationField) && newValue === '') continue

    if (shouldOverwrite(event[eventField], previousLocation?.[locationField])) {
      merged[eventField] = newValue
    }
  }

  return applyLocationTimesToEvent(merged, previousLocation, newLocation, defaultDate)
}

export function applyLocationTimesToEvent<T extends LocationAutofillFields>(
  event: T,
  previousLocation: Location | undefined,
  newLocation: Location | undefined,
  defaultDate = '',
): T {
  if (!newLocation) return event

  const startsAt = applyTimeToDateTime(
    event.startsAt,
    defaultDate,
    previousLocation?.startTime ?? '',
    newLocation.startTime,
  )
  const endFallbackDate = splitDateTime(startsAt).date || defaultDate
  const endsAt = applyTimeToDateTime(
    event.endsAt,
    endFallbackDate,
    previousLocation?.endTime ?? '',
    newLocation.endTime,
  )
  return { ...event, startsAt, endsAt }
}
