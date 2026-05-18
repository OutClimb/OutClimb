import type { CreateUserResponse, GetUsersResponse, TokenResponse, UpdateUserResponse, UserRequest } from '@/types/user'
import { UnauthorizedError } from '@/errors/unauthorized'
import { apiFetch } from './client'

export async function createUser(token: string, user: UserRequest): Promise<CreateUserResponse> {
  return apiFetch<CreateUserResponse>(token, 'POST', '/api/v1/user', user)
}

export async function removeUser(token: string, id: number): Promise<boolean> {
  await apiFetch(token, 'DELETE', `/api/v1/user/${id}`)
  return true
}

export async function updateUser(token: string, id: number, user: UserRequest): Promise<UpdateUserResponse> {
  return apiFetch<UpdateUserResponse>(token, 'PUT', `/api/v1/user/${id}`, user)
}

// fetchToken has no Authorization header and returns text, not JSON — keep inline
export async function fetchToken(username: string, password: string): Promise<TokenResponse> {
  let response: Response
  try {
    response = await fetch(`/api/v1/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
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

export async function fetchUsers(token: string): Promise<GetUsersResponse> {
  return apiFetch<GetUsersResponse>(token, 'GET', '/api/v1/user')
}

export async function updatePassword(token: string, password: string) {
  return apiFetch(token, 'PUT', '/api/v1/password', { password })
}
