import { describe, expect, it } from 'vitest'
import {
  hasEventLinkErrors,
  isValidEventLinkUrl,
  normalizeEventLink,
  swapEventLinks,
  validateEventLink,
} from './event-link'

const registerLink = { label: 'Register', url: 'https://forms.example.test' }
const gymLink = { label: 'Gym', url: 'https://gym.example.test' }
const guideLink = { label: 'Guide', url: 'https://guide.example.test' }

describe('swapEventLinks', () => {
  it('swaps two links without changing the original list', () => {
    const links = [registerLink, gymLink, guideLink]
    expect(swapEventLinks(links, 1, 2)).toEqual([registerLink, guideLink, gymLink])
    expect(links).toEqual([registerLink, gymLink, guideLink])
  })

  it.each([
    [0, -1],
    [2, 3],
  ])('leaves the list unchanged when swapping %i with out-of-range %i', (index, otherIndex) => {
    const links = [registerLink, gymLink, guideLink]
    expect(swapEventLinks(links, index, otherIndex)).toBe(links)
  })
})

describe('normalizeEventLink', () => {
  it('trims the URL and collapses whitespace in the label', () => {
    expect(normalizeEventLink({ label: '  Register   now ', url: ' https://example.test ' })).toEqual({
      label: 'Register now',
      url: 'https://example.test',
    })
  })
})

describe('isValidEventLinkUrl', () => {
  it.each(['https://example.test', 'https://forms.example.test/register?event=7'])('accepts %s', (url) => {
    expect(isValidEventLinkUrl(url)).toBe(true)
  })

  it.each(['', 'example.test', '/register', 'http://example.test', 'javascript:alert(1)', 'mailto:a@example.test'])(
    'rejects %s',
    (url) => {
      expect(isValidEventLinkUrl(url)).toBe(false)
    },
  )
})

describe('validateEventLink', () => {
  it('flags a blank label and an invalid URL', () => {
    expect(validateEventLink({ label: '   ', url: 'http://example.test' })).toEqual({
      label: 'Please enter a label',
      url: 'Please enter a full https:// URL',
    })
  })

  it('accepts a link with surrounding whitespace', () => {
    expect(validateEventLink({ label: ' Gym ', url: ' https://gym.example.test ' })).toEqual({ label: '', url: '' })
  })
})

describe('hasEventLinkErrors', () => {
  it('is false when every link is valid', () => {
    expect(hasEventLinkErrors([{ label: '', url: '' }])).toBe(false)
  })

  it('is true when any link has an error', () => {
    expect(
      hasEventLinkErrors([
        { label: '', url: '' },
        { label: '', url: 'Please enter a full https:// URL' },
      ]),
    ).toBe(true)
  })
})
