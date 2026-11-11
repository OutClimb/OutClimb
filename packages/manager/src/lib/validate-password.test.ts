import { describe, expect, it } from 'vitest'
import { validatePassword } from '@/lib/validate-password'

const VALID_PASSWORD = 'Abcdefghijklmn1!'

describe('validatePassword', () => {
  it('accepts a password meeting every rule', () => {
    expect(validatePassword(VALID_PASSWORD, 'someone')).toBeNull()
  })

  it('requires a value', () => {
    expect(validatePassword('', 'someone')).toBe('Please fill in this field')
  })

  it('enforces the 16 character minimum', () => {
    expect(validatePassword('Abcdefghijklm1!', 'someone')).toMatch(/at least 16/)
    expect(validatePassword(VALID_PASSWORD, 'someone')).toBeNull()
  })

  it('enforces the 72 character maximum', () => {
    const atLimit = 'Aa1!' + 'a'.repeat(68)
    expect(validatePassword(atLimit, 'someone')).toBeNull()
    expect(validatePassword(atLimit + 'a', 'someone')).toMatch(/at most 72/)
  })

  it.each([
    ['special character', 'Abcdefghijklmno1'],
    ['uppercase letter', 'abcdefghijklmn1!'],
    ['lowercase letter', 'ABCDEFGHIJKLMN1!'],
    ['number', 'Abcdefghijklmnop!'],
  ])('requires a %s', (rule, password) => {
    expect(validatePassword(password, 'someone')).toContain(rule)
  })

  it('rejects a password containing the username', () => {
    expect(validatePassword('Abcdefghijklmn1!nichole', 'nichole')).toMatch(/username/)
  })

  it('skips the username check when no username is given', () => {
    expect(validatePassword(VALID_PASSWORD, '')).toBeNull()
  })
})
