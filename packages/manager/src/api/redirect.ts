import type {
  CreateRedirectResponse,
  GetRedirectResponse,
  GetRedirectsResponse,
  Redirect,
  UpdateRedirectResponse,
} from '@/types/redirect'
import { apiFetch } from './client'

export async function createRedirect(token: string, redirect: Redirect): Promise<CreateRedirectResponse> {
  return apiFetch<CreateRedirectResponse>(token, 'POST', '/api/v1/redirect', redirect)
}

export async function fetchRedirect(token: string, id: number): Promise<GetRedirectResponse> {
  return apiFetch<GetRedirectResponse>(token, 'GET', `/api/v1/redirect/${id}`)
}

export async function fetchRedirects(token: string): Promise<GetRedirectsResponse> {
  return apiFetch<GetRedirectsResponse>(token, 'GET', '/api/v1/redirect')
}

export async function removeRedirect(token: string, id: number): Promise<boolean> {
  await apiFetch(token, 'DELETE', `/api/v1/redirect/${id}`)
  return true
}

export async function updateRedirect(token: string, redirect: Redirect): Promise<UpdateRedirectResponse> {
  return apiFetch<UpdateRedirectResponse>(token, 'PUT', `/api/v1/redirect/${redirect.id}`, redirect)
}
