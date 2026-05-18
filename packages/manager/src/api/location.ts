import type {
  CreateLocationResponse,
  GetLocationResponse,
  GetLocationsResponse,
  Location,
  UpdateLocationResponse,
} from '@/types/location'
import { apiFetch } from './client'

export async function createLocation(token: string, location: Location): Promise<CreateLocationResponse> {
  return apiFetch<CreateLocationResponse>(token, 'POST', '/api/v1/location', location)
}

export async function fetchLocation(token: string, id: number): Promise<GetLocationResponse> {
  return apiFetch<GetLocationResponse>(token, 'GET', `/api/v1/location/${id}`)
}

export async function fetchLocations(token: string): Promise<GetLocationsResponse> {
  return apiFetch<GetLocationsResponse>(token, 'GET', '/api/v1/location')
}

export async function removeLocation(token: string, id: number): Promise<boolean> {
  await apiFetch(token, 'DELETE', `/api/v1/location/${id}`)
  return true
}

export async function updateLocation(token: string, location: Location): Promise<UpdateLocationResponse> {
  return apiFetch<UpdateLocationResponse>(token, 'PUT', `/api/v1/location/${location.id}`, location)
}
