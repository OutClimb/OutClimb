export async function apiFetch<T>(
  method: 'GET' | 'POST',
  url: string,
  body?: unknown,
): Promise<T> {
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

  if (response.status >= 300) {
    throw new Error('An error occurred. Please try again.')
  }

  try {
    return (await response.json()) as T
  } catch {
    throw new Error('An error occurred. Please try again.')
  }
}
