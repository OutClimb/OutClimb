const CENTS_PER_UNIT = 100

const CSV_AMOUNT_DECIMALS = 2

export function formatDonationAmountPlain(amountCents: number): string {
  return (amountCents / CENTS_PER_UNIT).toFixed(CSV_AMOUNT_DECIMALS)
}

export function formatDonationAmount(amountCents: number, currency: string): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(
    amountCents / CENTS_PER_UNIT,
  )
}
