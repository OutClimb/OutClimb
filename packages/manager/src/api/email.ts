import type { CreateEmailResponse, Email, GetEmailsResponse, UpdateEmailResponse } from '@/types/email'
import { apiFetch } from './client'

export async function createEmail(token: string, email: Email): Promise<CreateEmailResponse> {
  return apiFetch<CreateEmailResponse>(token, 'POST', '/api/v1/email', email)
}

export async function fetchEmails(token: string): Promise<GetEmailsResponse> {
  return apiFetch<GetEmailsResponse>(token, 'GET', '/api/v1/email')
}

export async function removeEmail(token: string, id: number): Promise<boolean> {
  await apiFetch(token, 'DELETE', `/api/v1/email/${id}`)
  return true
}

export async function updateEmail(token: string, email: Email): Promise<UpdateEmailResponse> {
  return apiFetch<UpdateEmailResponse>(token, 'PUT', `/api/v1/email/${email.id}`, email)
}
