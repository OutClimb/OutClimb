import type {
  CreateLocationResponse,
  GetLocationResponse,
  GetLocationsResponse,
  Location,
  UpdateLocationResponse,
} from '@/types/location'
import { UnauthorizedError } from '@/errors/unauthorized'

export async function createLocation(token: string, location: Location): Promise<CreateLocationResponse> {
  let response
  try {
    response = await fetch(`/api/v1/location`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(location),
    })
  } catch {
    throw new Error('An error occurred. Please try again.')
  }

  if (response.status === 401) {
    throw new UnauthorizedError()
  } else if (response.status >= 300) {
    throw new Error('An error occurred. Please try again.')
  }

  try {
    return await response.json()
  } catch {
    throw new Error('An error occurred. Please try again.')
  }
}

export async function fetchLocation(token: string, id: number): Promise<GetLocationResponse> {
  let response
  try {
    response = await fetch(`/api/v1/location/${id}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
  } catch {
    throw new Error('An error occurred. Please try again.')
  }

  if (response.status === 401) {
    throw new UnauthorizedError()
  } else if (response.status >= 300) {
    throw new Error('An error occurred. Please try again.')
  }

  try {
    return await response.json()
  } catch {
    throw new Error('An error occurred. Please try again.')
  }
}

export async function fetchLocations(token: string): Promise<GetLocationsResponse> {
  let response
  try {
    response = await fetch(`/api/v1/location`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
  } catch {
    throw new Error('An error occurred. Please try again.')
  }

  if (response.status === 401) {
    throw new UnauthorizedError()
  } else if (response.status >= 300) {
    throw new Error('An error occurred. Please try again.')
  }

  try {
    return await response.json()
  } catch {
    throw new Error('An error occurred. Please try again.')
  }
}

export async function removeLocation(token: string, id: number): Promise<boolean> {
  let response
  try {
    response = await fetch(`/api/v1/location/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
  } catch {
    throw new Error('An error occurred. Please try again.')
  }

  if (response.status === 401) {
    throw new UnauthorizedError()
  } else if (response.status >= 300) {
    throw new Error('An error occurred. Please try again.')
  }

  return true
}

export async function updateLocation(token: string, location: Location): Promise<UpdateLocationResponse> {
  let response
  try {
    response = await fetch(`/api/v1/location/${location.id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(location),
    })
  } catch {
    throw new Error('An error occurred. Please try again.')
  }

  if (response.status === 401) {
    throw new UnauthorizedError()
  } else if (response.status >= 300) {
    throw new Error('An error occurred. Please try again.')
  }

  try {
    return await response.json()
  } catch {
    throw new Error('An error occurred. Please try again.')
  }
}
