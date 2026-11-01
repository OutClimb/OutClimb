import { describe, expect, it } from 'vitest'
import { findBrokenDependents, findDependents, renameConditionSource, stripBrokenRules } from '@/lib/conditions'
import { fieldConditions } from '@/lib/form-field'
import type { ConditionRule, FormField } from '@/types/form'

const field = (slug: string, type: string, meta: object | null = null): FormField => ({
  id: 0,
  name: slug,
  slug,
  type,
  metadata: meta ? JSON.stringify(meta) : null,
  validation: null,
  required: false,
  order: 0,
})

const rule = (source: string, operator: ConditionRule['operator'], value: string): ConditionRule => ({
  field: source,
  operator,
  value,
})

const conditional = (slug: string, rules: Array<ConditionRule>, extra: object = {}): FormField =>
  field(slug, 'text-input', { ...extra, conditions: { match: 'all', rules } })

const bySlug = (fields: Array<FormField>, slug: string) => fields.find((f) => f.slug === slug)!

describe('findDependents', () => {
  it('returns the fields with a rule on the slug', () => {
    const fields = [
      field('size', 'radios', { options: ['S', 'M'] }),
      conditional('a', [rule('size', 'equals', 'S')]),
      conditional('b', [rule('other', 'equals', 'x')]),
      field('c', 'text-input'),
    ]
    expect(findDependents(fields, 'size').map((f) => f.slug)).toEqual(['a'])
  })
})

describe('renameConditionSource', () => {
  it('updates every reference and leaves other rules alone', () => {
    const fields = [
      field('size', 'radios', { options: ['S'] }),
      field('other', 'text-input'),
      conditional('a', [rule('size', 'equals', 'S'), rule('other', 'equals', 'x')]),
      conditional('b', [rule('size', 'notEquals', 'S')]),
    ]
    const next = renameConditionSource(fields, 'size', 'shirt-size')

    expect(fieldConditions(bySlug(next, 'a').metadata)?.rules.map((r) => r.field)).toEqual(['shirt-size', 'other'])
    expect(fieldConditions(bySlug(next, 'b').metadata)?.rules.map((r) => r.field)).toEqual(['shirt-size'])
  })

  it('keeps the rest of the metadata', () => {
    const fields = [conditional('a', [rule('size', 'equals', 'S')], { placeholder: 'hi' })]
    const meta = JSON.parse(renameConditionSource(fields, 'size', 'x')[0].metadata!)
    expect(meta.placeholder).toBe('hi')
  })

  it('returns the same fields for an unchanged slug', () => {
    const fields = [conditional('a', [rule('size', 'equals', 'S')])]
    expect(renameConditionSource(fields, 'size', 'size')).toBe(fields)
  })
})

describe('deleting a source', () => {
  const fields = [
    field('size', 'radios', { options: ['S'] }),
    field('other', 'text-input'),
    conditional('a', [rule('size', 'equals', 'S')]),
    conditional('b', [rule('size', 'equals', 'S'), rule('other', 'equals', 'x')]),
  ]
  const remaining = fields.filter((f) => f.slug !== 'size')

  it('lists the dependents', () => {
    expect(findBrokenDependents(remaining).map((f) => f.slug)).toEqual(['a', 'b'])
  })

  it('removes the rules and clears conditions when none are left', () => {
    const next = stripBrokenRules(remaining)
    expect(bySlug(next, 'a').metadata).toBeNull()
    expect(fieldConditions(bySlug(next, 'b').metadata)?.rules).toEqual([rule('other', 'equals', 'x')])
  })

  it('keeps other metadata when conditions are cleared', () => {
    const next = stripBrokenRules([conditional('a', [rule('gone', 'equals', 'S')], { placeholder: 'hi' })])
    expect(JSON.parse(next[0].metadata!)).toEqual({ placeholder: 'hi' })
  })
})

describe('editing a source', () => {
  const target = (rules: Array<ConditionRule>) => conditional('t', rules)

  it('strips only the rules whose option was removed', () => {
    const fields = [
      field('size', 'radios', { options: ['S', 'L'] }),
      target([rule('size', 'equals', 'S'), rule('size', 'equals', 'M')]),
    ]
    expect(findBrokenDependents(fields).map((f) => f.slug)).toEqual(['t'])
    expect(fieldConditions(bySlug(stripBrokenRules(fields), 't').metadata)?.rules).toEqual([
      rule('size', 'equals', 'S'),
    ])
  })

  it('strips rules with an operator the new type does not allow', () => {
    const fields = [field('pick', 'radios', { options: ['A'] }), target([rule('pick', 'equals', 'A')])]
    const asCheckboxes = [field('pick', 'checkboxes', { options: ['A'] }), fields[1]]
    expect(findBrokenDependents(asCheckboxes).map((f) => f.slug)).toEqual(['t'])
    expect(bySlug(stripBrokenRules(asCheckboxes), 't').metadata).toBeNull()
  })

  it('strips rules when a choice source becomes free text and the option no longer applies', () => {
    const fields = [field('pick', 'text-input'), target([rule('pick', 'includes', 'A')])]
    expect(bySlug(stripBrokenRules(fields), 't').metadata).toBeNull()
  })

  it('strips rules when the source becomes a content field', () => {
    const fields = [field('pick', 'subheader'), target([rule('pick', 'equals', 'A')])]
    expect(findBrokenDependents(fields).map((f) => f.slug)).toEqual(['t'])
  })

  it('strips bool rules with a value that is not true or false', () => {
    const fields = [field('flag', 'bool'), target([rule('flag', 'equals', 'maybe')])]
    expect(bySlug(stripBrokenRules(fields), 't').metadata).toBeNull()
  })

  it('leaves valid rules untouched', () => {
    const fields = [field('size', 'radios', { options: ['S'] }), target([rule('size', 'equals', 'S')])]
    expect(findBrokenDependents(fields)).toEqual([])
    expect(stripBrokenRules(fields)).toEqual(fields)
  })
})
