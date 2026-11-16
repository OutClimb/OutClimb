export interface CreateDonationCheckoutRequest {
  amountCents: number
  altcha: string
  honeypot: string
}

export interface CreateDonationCheckoutResponse {
  url: string
}
