import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiFetch } from '@/api/client'
import { UnauthorizedError } from '@/errors/unauthorized'

const GENERIC_ERROR = 'An error occurred. Please try again.'

const stubFetchResponse = (status: number, body?: unknown) => {
  const fetchMock = vi.fn().mockResolvedValue({
    status,
    json: () => (body === undefined ? Promise.reject(new Error('no body')) : Promise.resolve(body)),
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('apiFetch', () => {
  it('sends the bearer token and JSON body, and returns the parsed response', async () => {
    const fetchMock = stubFetchResponse(200, { id: 1 })

    const result = await apiFetch('token-123', 'POST', '/api/v1/thing', { name: 'x' })

    expect(result).toEqual({ id: 1 })
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/thing', {
      method: 'POST',
      headers: { Authorization: 'Bearer token-123', 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'x' }),
    })
  })

  it('omits the body when none is given', async () => {
    const fetchMock = stubFetchResponse(200, [])

    await apiFetch('t', 'GET', '/api/v1/thing')

    expect(fetchMock.mock.calls[0][1]).not.toHaveProperty('body')
  })

  it('throws UnauthorizedError on 401', async () => {
    stubFetchResponse(401)
    await expect(apiFetch('t', 'GET', '/x')).rejects.toBeInstanceOf(UnauthorizedError)
  })

  it.each([300, 400, 404, 500])('throws a generic error on status %d', async (status) => {
    stubFetchResponse(status)
    await expect(apiFetch('t', 'GET', '/x')).rejects.toThrow(GENERIC_ERROR)
  })

  it('throws a generic error when the request itself fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('network down')))
    await expect(apiFetch('t', 'GET', '/x')).rejects.toThrow(GENERIC_ERROR)
  })

  it('throws a generic error when the response is not valid JSON', async () => {
    stubFetchResponse(200)
    await expect(apiFetch('t', 'GET', '/x')).rejects.toThrow(GENERIC_ERROR)
  })

  it('returns undefined for DELETE without reading the body', async () => {
    stubFetchResponse(204)
    await expect(apiFetch('t', 'DELETE', '/x')).resolves.toBeUndefined()
  })
})
