import type { GetDonationsResponse } from '@/types/donation'
import { apiFetch } from './client'

export async function fetchDonations(token: string): Promise<GetDonationsResponse> {
  return apiFetch<GetDonationsResponse>(token, 'GET', '/api/v1/donation')
}
