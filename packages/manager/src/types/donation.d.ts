export type GetDonationsResponse = Array<Donation>

export interface Donation {
  id: number
  amountCents: number
  currency: string
  donorName: string
  donorEmail: string
  status: string
  completedAt?: number
  createdAt: number
}
