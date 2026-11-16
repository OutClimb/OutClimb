import { describe, expect, it } from 'vitest'
import { formatDonationAmount } from './donation'

describe('formatDonationAmount', () => {
  it('formats cents as dollars', () => {
    expect(formatDonationAmount(2550, 'usd')).toBe('$25.50')
  })

  it('formats whole amounts with cents', () => {
    expect(formatDonationAmount(10000, 'USD')).toBe('$100.00')
  })
})
