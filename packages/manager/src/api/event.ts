import type {
  CreateEventResponse,
  EventRequest,
  GetEventResponse,
  GetEventsResponse,
  UpdateEventResponse,
} from '@/types/event'
import { apiFetch } from './client'

export async function createEvent(token: string, event: EventRequest): Promise<CreateEventResponse> {
  return apiFetch<CreateEventResponse>(token, 'POST', '/api/v1/event', event)
}

export async function fetchEvent(token: string, id: number): Promise<GetEventResponse> {
  return apiFetch<GetEventResponse>(token, 'GET', `/api/v1/event/${id}`)
}

export async function fetchEvents(token: string): Promise<GetEventsResponse> {
  return apiFetch<GetEventsResponse>(token, 'GET', '/api/v1/event')
}

export async function removeEvent(token: string, id: number): Promise<boolean> {
  await apiFetch(token, 'DELETE', `/api/v1/event/${id}`)
  return true
}

export async function updateEvent(token: string, id: number, event: EventRequest): Promise<UpdateEventResponse> {
  return apiFetch<UpdateEventResponse>(token, 'PUT', `/api/v1/event/${id}`, event)
}
