import { describe, expect, it } from 'vitest'
import {
  conditionOperatorsFor,
  fieldConditions,
  fieldOptions,
  isBoolField,
  isChoiceField,
  isContentField,
  newConditionRule,
} from '@/lib/form-field'
import type { FormField } from '@/types/form'

describe('isContentField', () => {
  it.each(['subheader', 'divider', 'paragraph'])('treats %s as content', (type) => {
    expect(isContentField(type)).toBe(true)
  })

  it('does not treat input fields as content', () => {
    expect(isContentField('text-input')).toBe(false)
  })
})

describe('conditionOperatorsFor', () => {
  it.each([
    ['checkboxes', ['includes', 'excludes']],
    ['bool', ['equals']],
    ['newsletter', ['equals']],
    ['radios', ['equals', 'notEquals']],
    ['select', ['equals', 'notEquals']],
    ['text-input', ['equals', 'notEquals']],
    ['email', ['equals', 'notEquals']],
    ['divider', []],
    ['unknown-type', []],
  ])('returns the allowed operators for %s', (type, operators) => {
    expect(conditionOperatorsFor(type)).toEqual(operators)
  })
})

describe('field type predicates', () => {
  it('identifies choice fields', () => {
    expect(['checkboxes', 'radios', 'select'].every(isChoiceField)).toBe(true)
    expect(isChoiceField('bool')).toBe(false)
  })

  it('identifies bool fields', () => {
    expect(isBoolField('bool')).toBe(true)
    expect(isBoolField('newsletter')).toBe(true)
    expect(isBoolField('radios')).toBe(false)
  })
})

describe('fieldOptions', () => {
  it('returns the options from metadata', () => {
    expect(fieldOptions(JSON.stringify({ options: ['S', 'M'] }))).toEqual(['S', 'M'])
  })

  it.each([
    ['null metadata', null],
    ['invalid JSON', '{not json'],
    ['missing options', JSON.stringify({})],
    ['non-array options', JSON.stringify({ options: 'S' })],
  ])('returns an empty list for %s', (_, metadata) => {
    expect(fieldOptions(metadata)).toEqual([])
  })
})

describe('fieldConditions', () => {
  const conditions = { match: 'all', rules: [{ field: 'size', operator: 'equals', value: 'S' }] }

  it('returns the conditions from metadata', () => {
    expect(fieldConditions(JSON.stringify({ conditions }))).toEqual(conditions)
  })

  it.each([
    ['null metadata', null],
    ['invalid JSON', '{not json'],
    ['missing conditions', JSON.stringify({})],
    ['empty rules', JSON.stringify({ conditions: { match: 'all', rules: [] } })],
    ['non-array rules', JSON.stringify({ conditions: { match: 'all', rules: 'x' } })],
  ])('returns null for %s', (_, metadata) => {
    expect(fieldConditions(metadata)).toBeNull()
  })
})

describe('newConditionRule', () => {
  const source = (type: string) => ({ slug: 'source', type }) as FormField

  it('starts with the first allowed operator and an empty value', () => {
    expect(newConditionRule(source('radios'))).toEqual({ field: 'source', operator: 'equals', value: '' })
  })

  it('defaults bool sources to true', () => {
    expect(newConditionRule(source('bool'))).toEqual({ field: 'source', operator: 'equals', value: 'true' })
  })
})
