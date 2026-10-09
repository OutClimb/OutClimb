import { NotFoundError } from '@/errors/not-found'

export async function apiFetch<T>(method: 'GET' | 'POST', url: string, body?: unknown): Promise<T> {
  let response: Response
  try {
    response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    })
  } catch {
    throw new Error('An error occurred. Please try again.')
  }

  if (response.status === 404) {
    throw new NotFoundError()
  } else if (response.status === 403) {
    throw new Error("We couldn't verify that you're not a robot. Please try again.")
  } else if (response.status === 429) {
    throw new Error('Too many requests. Please wait a moment and try again.')
  } else if (response.status === 400) {
    throw new Error('Some of your answers are invalid. Please check them and try again.')
  } else if (response.status >= 300) {
    throw new Error('An error occurred. Please try again.')
  }

  try {
    return (await response.json()) as T
  } catch {
    throw new Error('An error occurred. Please try again.')
  }
}
