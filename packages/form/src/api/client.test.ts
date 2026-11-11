import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiFetch } from '@/api/client'
import { NotFoundError } from '@/errors/not-found'

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
  it('sends the JSON body and returns the parsed response', async () => {
    const fetchMock = stubFetchResponse(200, { id: 1 })

    const result = await apiFetch('POST', '/api/v1/thing', { name: 'x' })

    expect(result).toEqual({ id: 1 })
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/thing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'x' }),
    })
  })

  it('omits the body when none is given', async () => {
    const fetchMock = stubFetchResponse(200, {})

    await apiFetch('GET', '/api/v1/thing')

    expect(fetchMock.mock.calls[0][1]).not.toHaveProperty('body')
  })

  it('throws NotFoundError on 404', async () => {
    stubFetchResponse(404)
    await expect(apiFetch('GET', '/x')).rejects.toBeInstanceOf(NotFoundError)
  })

  it.each([
    [403, "We couldn't verify that you're not a robot. Please try again."],
    [429, 'Too many requests. Please wait a moment and try again.'],
    [400, 'Some of your answers are invalid. Please check them and try again.'],
    [300, GENERIC_ERROR],
    [500, GENERIC_ERROR],
  ])('throws a friendly error on status %d', async (status, message) => {
    stubFetchResponse(status)
    await expect(apiFetch('GET', '/x')).rejects.toThrow(message)
  })

  it('throws a generic error when the request itself fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('network down')))
    await expect(apiFetch('GET', '/x')).rejects.toThrow(GENERIC_ERROR)
  })

  it('throws a generic error when the response is not valid JSON', async () => {
    stubFetchResponse(200)
    await expect(apiFetch('GET', '/x')).rejects.toThrow(GENERIC_ERROR)
  })
})
