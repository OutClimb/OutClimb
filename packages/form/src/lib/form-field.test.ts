import { describe, expect, it } from 'vitest'
import { initialValue, isContentField, parseMetadata } from '@/lib/form-field'

describe('isContentField', () => {
  it.each(['subheader', 'divider', 'paragraph'])('treats %s as content', (type) => {
    expect(isContentField(type)).toBe(true)
  })

  it('does not treat input fields as content', () => {
    expect(isContentField('text-input')).toBe(false)
  })
})

describe('parseMetadata', () => {
  it('parses options, placeholder, content, and conditions', () => {
    const conditions = { match: 'all', rules: [{ field: 'a', operator: 'equals', value: 'x' }] }
    const metadata = JSON.stringify({ options: ['S', 'M'], placeholder: 'pick', content: 'hi', conditions })

    expect(parseMetadata(metadata)).toEqual({ options: ['S', 'M'], placeholder: 'pick', content: 'hi', conditions })
  })

  it.each([
    ['null metadata', null],
    ['empty string', ''],
    ['invalid JSON', '{not json'],
    ['JSON null', 'null'],
  ])('returns empty options for %s', (_label, metadata) => {
    expect(parseMetadata(metadata)).toEqual({ options: [] })
  })

  it('ignores values of the wrong type', () => {
    const metadata = JSON.stringify({ options: 'nope', placeholder: 3, content: false, conditions: { rules: 'x' } })

    expect(parseMetadata(metadata)).toEqual({
      options: [],
      placeholder: undefined,
      content: undefined,
      conditions: undefined,
    })
  })
})

describe('initialValue', () => {
  it.each(['bool', 'newsletter'])('starts %s unchecked', (type) => {
    expect(initialValue(type)).toBe(false)
  })

  it('starts checkboxes empty', () => {
    expect(initialValue('checkboxes')).toEqual([])
  })

  it.each(['text-input', 'select', 'radios', 'email'])('starts %s as an empty string', (type) => {
    expect(initialValue(type)).toBe('')
  })
})
