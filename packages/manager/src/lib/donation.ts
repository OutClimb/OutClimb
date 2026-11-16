const CENTS_PER_UNIT = 100

export function formatDonationAmount(amountCents: number, currency: string): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(
    amountCents / CENTS_PER_UNIT,
  )
}
