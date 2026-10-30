import { describe, expect, it } from 'vitest'
import { isFieldVisible } from '@/lib/conditions'
import type { FieldValue } from '@/lib/form-field'
import type { ConditionOperator, FieldConditions, FormField } from '@/types/form'

const field = (slug: string, type: string, metadata: object | null = null): FormField => ({
  id: 0,
  name: slug,
  slug,
  type,
  metadata: metadata ? JSON.stringify(metadata) : null,
  validation: null,
  required: false,
  order: 0,
})

const sources = [
  field('radio', 'radios'),
  field('select', 'select'),
  field('checks', 'checkboxes'),
  field('flag', 'bool'),
  field('news', 'newsletter'),
  field('text', 'text-input'),
  field('email', 'email'),
  field('headline', 'subheader'),
]
const fieldsBySlug = new Map(sources.map((f) => [f.slug, f]))

const rule = (source: string, operator: string, value: string) => ({
  field: source,
  operator: operator as ConditionOperator,
  value,
})
const one = (r: ReturnType<typeof rule>): FieldConditions => ({ match: 'all', rules: [r] })

// Mirrors the table in internal/app/conditions_test.go. Checkbox values are string arrays here, and
// bool values are booleans, which is how the form holds them before they're serialized.
const cases: Array<[string, FieldConditions | null, Record<string, FieldValue>, boolean]> = [
  ['nil conditions', null, {}, true],
  ['no rules', { match: 'all', rules: [] }, {}, true],

  ['radios equals match', one(rule('radio', 'equals', 'Yes')), { radio: 'Yes' }, true],
  ['radios equals miss', one(rule('radio', 'equals', 'Yes')), { radio: 'No' }, false],
  ['radios equals is case sensitive', one(rule('radio', 'equals', 'Yes')), { radio: 'yes' }, false],
  ['radios notEquals match', one(rule('radio', 'notEquals', 'Yes')), { radio: 'No' }, true],
  ['radios notEquals miss', one(rule('radio', 'notEquals', 'Yes')), { radio: 'Yes' }, false],
  ['radios equals empty', one(rule('radio', 'equals', 'Yes')), {}, false],
  ['radios notEquals empty', one(rule('radio', 'notEquals', 'Yes')), {}, true],
  ['select equals match', one(rule('select', 'equals', 'A')), { select: 'A' }, true],
  ['select includes not allowed', one(rule('select', 'includes', 'A')), { select: 'A' }, false],

  ['checkboxes includes match', one(rule('checks', 'includes', 'B')), { checks: ['A', 'B', 'C'] }, true],
  ['checkboxes includes miss', one(rule('checks', 'includes', 'D')), { checks: ['A', 'B', 'C'] }, false],
  ['checkboxes includes is not substring', one(rule('checks', 'includes', 'A')), { checks: ['AB', 'C'] }, false],
  ['checkboxes excludes match', one(rule('checks', 'excludes', 'D')), { checks: ['A', 'B'] }, true],
  ['checkboxes excludes miss', one(rule('checks', 'excludes', 'A')), { checks: ['A', 'B'] }, false],
  ['checkboxes includes empty', one(rule('checks', 'includes', 'A')), { checks: [] }, false],
  ['checkboxes excludes empty', one(rule('checks', 'excludes', 'A')), {}, true],

  ['bool checked equals true', one(rule('flag', 'equals', 'true')), { flag: true }, true],
  ['bool unchecked equals true', one(rule('flag', 'equals', 'true')), { flag: false }, false],
  ['bool unchecked equals false', one(rule('flag', 'equals', 'false')), { flag: false }, true],
  ['bool checked equals false', one(rule('flag', 'equals', 'false')), { flag: true }, false],
  ['bool empty equals false', one(rule('flag', 'equals', 'false')), {}, true],
  ['bool empty equals true', one(rule('flag', 'equals', 'true')), {}, false],
  ['bool notEquals not allowed', one(rule('flag', 'notEquals', 'true')), { flag: false }, false],
  ['newsletter checked', one(rule('news', 'equals', 'true')), { news: true }, true],

  ['text equals exact', one(rule('text', 'equals', 'hello')), { text: 'hello' }, true],
  ['text equals ignores case', one(rule('text', 'equals', 'Hello')), { text: 'hELLO' }, true],
  ['text equals trims value', one(rule('text', 'equals', 'hello')), { text: '  hello \n' }, true],
  ['text equals trims rule', one(rule('text', 'equals', ' hello ')), { text: 'hello' }, true],
  ['text equals miss', one(rule('text', 'equals', 'hello')), { text: 'hello there' }, false],
  ['text notEquals match', one(rule('text', 'notEquals', 'hello')), { text: 'bye' }, true],
  ['text notEquals miss', one(rule('text', 'notEquals', 'hello')), { text: ' HELLO ' }, false],
  ['text equals empty', one(rule('text', 'equals', 'hello')), {}, false],
  ['text notEquals empty', one(rule('text', 'notEquals', 'hello')), {}, true],
  ['email equals ignores case', one(rule('email', 'equals', 'A@B.com')), { email: 'a@b.com' }, true],
  ['text includes not allowed', one(rule('text', 'includes', 'hello')), { text: 'hello' }, false],

  ['unknown source', one(rule('missing', 'equals', 'x')), { missing: 'x' }, false],
  ['content source', one(rule('headline', 'equals', 'x')), { headline: 'x' }, false],
  ['unknown operator', one(rule('radio', 'contains', 'Yes')), { radio: 'Yes' }, false],

  [
    'all: both match',
    { match: 'all', rules: [rule('radio', 'equals', 'Yes'), rule('flag', 'equals', 'true')] },
    { radio: 'Yes', flag: true },
    true,
  ],
  [
    'all: one misses',
    { match: 'all', rules: [rule('radio', 'equals', 'Yes'), rule('flag', 'equals', 'true')] },
    { radio: 'Yes', flag: false },
    false,
  ],
  [
    'any: one matches',
    { match: 'any', rules: [rule('radio', 'equals', 'Yes'), rule('flag', 'equals', 'true')] },
    { radio: 'No', flag: true },
    true,
  ],
  [
    'any: none match',
    { match: 'any', rules: [rule('radio', 'equals', 'Yes'), rule('flag', 'equals', 'true')] },
    { radio: 'No', flag: false },
    false,
  ],
]

describe('isFieldVisible', () => {
  it.each(cases)('%s', (_name, conditions, values, want) => {
    const target = field('target', 'text-input', conditions ? { conditions } : null)
    expect(isFieldVisible(target, fieldsBySlug, values)).toBe(want)
  })

  it('treats unreadable metadata as no conditions', () => {
    const target = { ...field('target', 'text-input'), metadata: '{' }
    expect(isFieldVisible(target, fieldsBySlug, {})).toBe(true)
  })
})
