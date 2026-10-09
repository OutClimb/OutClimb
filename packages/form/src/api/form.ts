import type { CreateSubmissionRequest, GetFormResponse } from '@/types/form'
import { apiFetch } from './client'

export async function fetchForm(slug: string): Promise<GetFormResponse> {
  return apiFetch<GetFormResponse>('GET', `/api/v1/form/${encodeURIComponent(slug)}`)
}

export async function createSubmission(slug: string, body: CreateSubmissionRequest): Promise<boolean> {
  await apiFetch('POST', `/api/v1/submission/${encodeURIComponent(slug)}`, body)
  return true
}
