import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  calculateFeeCents,
  createDonationCheckout,
  dollarsToCents,
  formatCentsAsDollars,
  MAXIMUM_DONATION_CENTS,
  MINIMUM_DONATION_CENTS,
} from '@/api/donation'
import { apiFetch } from '@/api/client'

const stubFetchResponse = (status: number, body?: unknown) => {
  const fetchMock = vi.fn().mockResolvedValue({
    status,
    json: () => (body === undefined ? Promise.reject(new Error('no body')) : Promise.resolve(body)),
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('dollarsToCents', () => {
  it.each([
    ['25', 2500],
    ['25.5', 2550],
    ['25.50', 2550],
    ['0.07', 7],
    ['19.99', 1999],
    ['  10 ', 1000],
    ['.5', 50],
    ['.50', 50],
    ['1.', 100],
  ])('converts %s to %i cents', (dollars, cents) => {
    expect(dollarsToCents(dollars)).toBe(cents)
  })

  it.each(['', 'abc', '-5', '.', '1.234', '1,000', '$10', '1e3'])('rejects %j', (dollars) => {
    expect(dollarsToCents(dollars)).toBeNull()
  })

  it('avoids floating point drift', () => {
    expect(dollarsToCents('1.15')).toBe(115)
    expect(dollarsToCents('4.35')).toBe(435)
  })
})

describe('donation bounds', () => {
  it('match the backend limits', () => {
    expect(MINIMUM_DONATION_CENTS).toBe(100)
    expect(MAXIMUM_DONATION_CENTS).toBe(50000)
  })
})

describe('formatCentsAsDollars', () => {
  it('formats whole dollar amounts without cents', () => {
    expect(formatCentsAsDollars(2500)).toBe('$25')
  })

  it('keeps cents when the amount is not whole', () => {
    expect(formatCentsAsDollars(2625)).toBe('$26.25')
  })
})

describe('calculateFeeCents', () => {
  it('is 5% of the donation', () => {
    expect(calculateFeeCents(2500)).toBe(125)
  })

  it('rounds partial cents up', () => {
    expect(calculateFeeCents(1999)).toBe(100)
    expect(calculateFeeCents(100)).toBe(5)
    expect(calculateFeeCents(110)).toBe(6)
  })
})

describe('createDonationCheckout', () => {
  it('posts the donation and returns the checkout url', async () => {
    const fetchMock = stubFetchResponse(200, { url: 'https://checkout.stripe.com/c/pay/abc' })
    const body = { amountCents: 2500, altcha: 'payload', honeypot: '' }

    const url = await createDonationCheckout(body)

    expect(url).toBe('https://checkout.stripe.com/c/pay/abc')
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/donation/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  })

  it('rejects a successful response without a url', async () => {
    stubFetchResponse(200, {})

    await expect(createDonationCheckout({ amountCents: 2500, altcha: 'payload', honeypot: 'bot' })).rejects.toThrow(
      'An error occurred. Please try again.',
    )
  })

  it('surfaces a captcha failure', async () => {
    stubFetchResponse(403)

    await expect(createDonationCheckout({ amountCents: 2500, altcha: '', honeypot: '' })).rejects.toThrow(
      "We couldn't verify that you're not a robot. Please try again.",
    )
  })

  it('surfaces an invalid amount', async () => {
    stubFetchResponse(400)

    await expect(createDonationCheckout({ amountCents: 1, altcha: 'x', honeypot: '' })).rejects.toThrow(
      'That donation amount is invalid. Please check it and try again.',
    )
  })
})

describe('apiFetch', () => {
  it('rate limits', async () => {
    stubFetchResponse(429)
    await expect(apiFetch('POST', '/x', {})).rejects.toThrow('Too many requests. Please wait a moment and try again.')
  })

  it('reports network failures generically', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    await expect(apiFetch('GET', '/x')).rejects.toThrow('An error occurred. Please try again.')
  })

  it('reports server errors generically', async () => {
    stubFetchResponse(500)
    await expect(apiFetch('GET', '/x')).rejects.toThrow('An error occurred. Please try again.')
  })

  it('reports an unparseable body generically', async () => {
    stubFetchResponse(200)
    await expect(apiFetch('GET', '/x')).rejects.toThrow('An error occurred. Please try again.')
  })
})
