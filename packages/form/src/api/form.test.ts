import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSubmission, fetchForm } from '@/api/form'

const stubFetchOk = () => {
  const fetchMock = vi.fn().mockResolvedValue({ status: 200, json: () => Promise.resolve({}) })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('fetchForm', () => {
  it('requests the form by slug, URL-encoding it', async () => {
    const fetchMock = stubFetchOk()

    await fetchForm('a b/c')

    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/form/a%20b%2Fc')
    expect(fetchMock.mock.calls[0][1].method).toBe('GET')
  })
})

describe('createSubmission', () => {
  it('posts the submission to the encoded slug and resolves true', async () => {
    const fetchMock = stubFetchOk()
    const body = { values: { name: 'Emily' }, altcha: 'token', honeypot: '' }

    await expect(createSubmission('a b', body)).resolves.toBe(true)

    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/submission/a%20b')
    expect(fetchMock.mock.calls[0][1].method).toBe('POST')
    expect(fetchMock.mock.calls[0][1].body).toBe(JSON.stringify(body))
  })

  it('propagates API errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 429 }))
    await expect(createSubmission('x', { values: {}, altcha: '', honeypot: '' })).rejects.toThrow('Too many requests')
  })
})
