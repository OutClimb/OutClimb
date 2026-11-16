import type { CreateDonationCheckoutRequest, CreateDonationCheckoutResponse } from '@/types/donation'
import { apiFetch, GENERIC_ERROR_MESSAGE } from './client'

// Must match minimumDonationCents and maximumDonationCents in the backend's internal/app/donation.go.
export const MINIMUM_DONATION_CENTS = 100
export const MAXIMUM_DONATION_CENTS = 50000

const CENTS_PER_DOLLAR = 100
export const STRIPE_FEE_PERCENT = 5
const PERCENT_DIVISOR = 100
const DOLLAR_AMOUNT_PATTERN = /^(\d*)(?:\.(\d{0,2}))?$/

export function dollarsToCents(dollars: string): number | null {
  const match = DOLLAR_AMOUNT_PATTERN.exec(dollars.trim())
  if (!match) return null

  const [, wholeDollars, fractionalDollars = ''] = match
  if (wholeDollars === '' && fractionalDollars === '') return null

  const cents = fractionalDollars.padEnd(2, '0')
  return Number(wholeDollars) * CENTS_PER_DOLLAR + Number(cents)
}

export function calculateFeeCents(donationCents: number): number {
  return Math.ceil((donationCents * STRIPE_FEE_PERCENT) / PERCENT_DIVISOR)
}

export function formatCentsAsDollars(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: cents % CENTS_PER_DOLLAR === 0 ? 0 : 2,
  }).format(cents / CENTS_PER_DOLLAR)
}

const INVALID_AMOUNT_ERROR = 'Please enter a valid dollar amount.'
const BELOW_MINIMUM_ERROR = `The minimum donation is ${formatCentsAsDollars(MINIMUM_DONATION_CENTS)}.`
const ABOVE_MAXIMUM_ERROR = `The maximum donation is ${formatCentsAsDollars(MAXIMUM_DONATION_CENTS)}.`
const FEES_TOTAL_ERROR = `With fees included, the total can't be more than ${formatCentsAsDollars(MAXIMUM_DONATION_CENTS)}.`

export function validateAmount(dollars: string, coverFees: boolean): { cents: number } | { error: string } {
  const donationCents = dollarsToCents(dollars)
  if (donationCents === null) {
    return { error: INVALID_AMOUNT_ERROR }
  }
  if (donationCents < MINIMUM_DONATION_CENTS) {
    return { error: BELOW_MINIMUM_ERROR }
  }
  if (donationCents > MAXIMUM_DONATION_CENTS) {
    return { error: ABOVE_MAXIMUM_ERROR }
  }

  const totalCents = coverFees ? donationCents + calculateFeeCents(donationCents) : donationCents
  if (totalCents > MAXIMUM_DONATION_CENTS) {
    return { error: FEES_TOTAL_ERROR }
  }
  return { cents: totalCents }
}

export async function createDonationCheckout(body: CreateDonationCheckoutRequest): Promise<string> {
  const response = await apiFetch<CreateDonationCheckoutResponse>('POST', '/api/v1/donation/checkout', body)
  if (!response.url) {
    throw new Error(GENERIC_ERROR_MESSAGE)
  }
  return response.url
}
