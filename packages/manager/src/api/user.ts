import type { TokenResponse } from '@/types/user'
import { UnauthorizedError } from '@/errors/unauthorized'

export async function fetchToken(username: string, password: string): Promise<TokenResponse> {
  const formData = {
    username,
    password,
  }
  let response
  try {
    response = await fetch(`/api/v1/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    })
  } catch {
    throw new Error('An error occurred. Please try again.')
  }

  if (response.status === 401) {
    throw new UnauthorizedError()
  } else if (!response.ok) {
    throw new Error('An error occurred. Please try again.')
  }

  try {
    return await response.text()
  } catch {
    throw new Error('An error occurred. Please try again.')
  }
}

export async function updatePassword(token: string, password: string) {
  const formData = {
    password,
  }
  let response
  try {
    response = await fetch(`/api/v1/password`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    })
  } catch {
    throw new Error('An error occurred. Please try again.')
  }

  if (response.status === 401) {
    throw new UnauthorizedError()
  } else if (!response.ok) {
    throw new Error('An error occurred. Please try again.')
  }

  try {
    return await response.json()
  } catch {
    throw new Error('An error occurred. Please try again.')
  }
}
