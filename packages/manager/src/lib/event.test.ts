import { describe, expect, it } from 'vitest'
import { applyLocationTimesToEvent, applyLocationToEvent, parseTimeOfDay } from './event'
import type { LocationAutofillFields } from './event'
import type { Location } from '@/types/location'

function buildLocation(overrides: Partial<Location> = {}): Location {
  return {
    id: 1,
    name: 'Location A',
    mainImageName: '',
    individualImageName: '',
    backgroundImagePath: '',
    color: '',
    address: '1 A St',
    city: 'Alpha',
    state: 'AA',
    zip: '11111',
    startTime: '6:00 PM',
    endTime: '8:00 PM',
    description: 'social description A',
    excerpt: 'Excerpt A',
    longDescription: 'Body A',
    ...overrides,
  }
}

interface TestEvent extends LocationAutofillFields {
  title: string
  featuredImageAssetId: string
  featuredImageAltText: string
}

function buildEvent(overrides: Partial<TestEvent> = {}): TestEvent {
  return {
    title: 'Climb night',
    startsAt: '',
    endsAt: '',
    locationName: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    excerpt: '',
    body: '',
    featuredImageAssetId: '7',
    featuredImageAltText: 'Climbers on a wall',
    ...overrides,
  }
}

const locationA = buildLocation()
const locationB = buildLocation({
  id: 2,
  name: 'Location B',
  address: '2 B St',
  city: 'Beta',
  state: 'BB',
  zip: '22222',
  startTime: '7:30 PM',
  endTime: '9:30 PM',
  excerpt: 'Excerpt B',
  longDescription: 'Body B',
})

const mappedTextFields: Array<{ eventField: keyof LocationAutofillFields; fromA: string; fromB: string }> = [
  { eventField: 'locationName', fromA: 'Location A', fromB: 'Location B' },
  { eventField: 'address', fromA: '1 A St', fromB: '2 B St' },
  { eventField: 'city', fromA: 'Alpha', fromB: 'Beta' },
  { eventField: 'state', fromA: 'AA', fromB: 'BB' },
  { eventField: 'zip', fromA: '11111', fromB: '22222' },
  { eventField: 'excerpt', fromA: 'Excerpt A', fromB: 'Excerpt B' },
  { eventField: 'body', fromA: 'Body A', fromB: 'Body B' },
]

describe('parseTimeOfDay', () => {
  it.each([
    ['6:00 PM', '18:00'],
    ['6pm', '18:00'],
    ['6:30 p.m.', '18:30'],
    ['12:00 AM', '00:00'],
    ['12:15 PM', '12:15'],
    ['18:45', '18:45'],
    ['9', '09:00'],
  ])('parses %s as %s', (text, expected) => {
    expect(parseTimeOfDay(text)).toBe(expected)
  })

  it.each(['', 'evening', '13 PM', '6:75 PM', '25:00'])('rejects %j', (text) => {
    expect(parseTimeOfDay(text)).toBeNull()
  })
})

describe('applyLocationToEvent', () => {
  describe.each(mappedTextFields)('$eventField', ({ eventField, fromA, fromB }) => {
    it('fills when empty', () => {
      const result = applyLocationToEvent(buildEvent(), undefined, locationA)
      expect(result[eventField]).toBe(fromA)
    })

    it('replaces when unchanged from the previous location', () => {
      const result = applyLocationToEvent(buildEvent({ [eventField]: fromA }), locationA, locationB)
      expect(result[eventField]).toBe(fromB)
    })

    it('keeps user edits', () => {
      const result = applyLocationToEvent(buildEvent({ [eventField]: 'my edit' }), locationA, locationB)
      expect(result[eventField]).toBe('my edit')
    })
  })

  it('does not overwrite a filled field when there is no previous location', () => {
    const result = applyLocationToEvent(buildEvent({ body: 'my body' }), undefined, locationA)
    expect(result.body).toBe('my body')
  })

  it('restores values when switching A to B to A', () => {
    const atA = applyLocationToEvent(buildEvent(), undefined, locationA)
    const atB = applyLocationToEvent(atA, locationA, locationB)
    const backAtA = applyLocationToEvent(atB, locationB, locationA)

    expect(atB.body).toBe('Body B')
    expect(backAtA).toEqual(atA)
  })

  it('keeps an edited body across A to B to A', () => {
    const atA = applyLocationToEvent(buildEvent(), undefined, locationA)
    const edited = { ...atA, body: 'edited body' }
    const atB = applyLocationToEvent(edited, locationA, locationB)
    const backAtA = applyLocationToEvent(atB, locationB, locationA)

    expect(backAtA.body).toBe('edited body')
  })

  it('leaves excerpt and body when the new location has none', () => {
    const bare = buildLocation({ id: 3, excerpt: '', longDescription: '' })
    const result = applyLocationToEvent(buildEvent({ excerpt: 'Excerpt A', body: 'Body A' }), locationA, bare)

    expect(result.excerpt).toBe('Excerpt A')
    expect(result.body).toBe('Body A')
  })

  it('leaves the event unchanged when there is no new location', () => {
    const event = buildEvent({ body: 'Body A', city: 'Alpha' })
    expect(applyLocationToEvent(event, locationA, undefined)).toEqual(event)
  })

  it('does not use the social image description', () => {
    const result = applyLocationToEvent(buildEvent(), undefined, locationA)
    expect(Object.values(result)).not.toContain('social description A')
  })

  it('leaves the featured image and alt text alone', () => {
    const event = buildEvent()
    const result = applyLocationToEvent(event, undefined, locationA)

    expect(result.featuredImageAssetId).toBe(event.featuredImageAssetId)
    expect(result.featuredImageAltText).toBe(event.featuredImageAltText)
    expect(result.title).toBe(event.title)
  })

  describe('times', () => {
    it('applies location times on the date already entered', () => {
      const event = buildEvent({ startsAt: '2026-12-05T00:00', endsAt: '2026-12-05T00:00' })
      const result = applyLocationToEvent(event, undefined, locationA)

      expect(result.startsAt).toBe('2026-12-05T18:00')
      expect(result.endsAt).toBe('2026-12-05T20:00')
    })

    it('replaces times that still match the previous location', () => {
      const event = buildEvent({ startsAt: '2026-12-05T18:00', endsAt: '2026-12-05T20:00' })
      const result = applyLocationToEvent(event, locationA, locationB)

      expect(result.startsAt).toBe('2026-12-05T19:30')
      expect(result.endsAt).toBe('2026-12-05T21:30')
    })

    it('keeps user-edited times', () => {
      const event = buildEvent({ startsAt: '2026-12-05T17:15', endsAt: '2026-12-05T20:00' })
      const result = applyLocationToEvent(event, locationA, locationB)

      expect(result.startsAt).toBe('2026-12-05T17:15')
      expect(result.endsAt).toBe('2026-12-05T21:30')
    })

    it('uses the start date for an empty end', () => {
      const event = buildEvent({ startsAt: '2026-12-05T18:00' })
      const result = applyLocationToEvent(event, undefined, locationA)

      expect(result.endsAt).toBe('2026-12-05T20:00')
    })

    it('defaults to the given date when no date is entered', () => {
      const result = applyLocationToEvent(buildEvent(), undefined, locationA, '2026-11-24')

      expect(result.startsAt).toBe('2026-11-24T18:00')
      expect(result.endsAt).toBe('2026-11-24T20:00')
    })

    it('leaves times empty when no date is entered and no default is given', () => {
      const result = applyLocationToEvent(buildEvent(), undefined, locationA)

      expect(result.startsAt).toBe('')
      expect(result.endsAt).toBe('')
    })

    it('prefers the entered date over the default date', () => {
      const event = buildEvent({ startsAt: '2026-12-05T00:00' })
      const result = applyLocationToEvent(event, undefined, locationA, '2026-11-24')

      expect(result.startsAt).toBe('2026-12-05T18:00')
      expect(result.endsAt).toBe('2026-12-05T20:00')
    })

    it('leaves times alone when the location time cannot be parsed', () => {
      const unparseable = buildLocation({ startTime: 'after work', endTime: '' })
      const event = buildEvent({ startsAt: '2026-12-05T10:00', endsAt: '2026-12-05T11:00' })
      const result = applyLocationToEvent(event, undefined, unparseable)

      expect(result.startsAt).toBe('2026-12-05T10:00')
      expect(result.endsAt).toBe('2026-12-05T11:00')
    })
  })
})

describe('applyLocationTimesToEvent', () => {
  it('fills the times once a date is entered after the location was chosen', () => {
    const event = buildEvent({ startsAt: '2026-12-05T00:00' })
    const result = applyLocationTimesToEvent(event, locationA, locationA)

    expect(result.startsAt).toBe('2026-12-05T18:00')
    expect(result.endsAt).toBe('2026-12-05T20:00')
  })

  it('keeps a time the user already changed', () => {
    const event = buildEvent({ startsAt: '2026-12-05T17:15' })
    expect(applyLocationTimesToEvent(event, locationA, locationA).startsAt).toBe('2026-12-05T17:15')
  })

  it('does nothing without a location', () => {
    const event = buildEvent({ startsAt: '2026-12-05T00:00' })
    expect(applyLocationTimesToEvent(event, undefined, undefined)).toEqual(event)
  })
})
