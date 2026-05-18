import { UnauthorizedError } from '@/errors/unauthorized'

export async function apiFetch<T>(
  token: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  url: string,
  body?: unknown,
): Promise<T> {
  let response: Response
  try {
    response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    })
  } catch {
    throw new Error('An error occurred. Please try again.')
  }

  if (response.status === 401) {
    throw new UnauthorizedError()
  } else if (response.status >= 300) {
    throw new Error('An error occurred. Please try again.')
  }

  if (method === 'DELETE') {
    return undefined as T
  }

  try {
    return (await response.json()) as T
  } catch {
    throw new Error('An error occurred. Please try again.')
  }
}
