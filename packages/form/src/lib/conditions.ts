import { parseMetadata, type FieldValue } from '@/lib/form-field'
import type { ConditionRule, FormField } from '@/types/form'

const FREE_TEXT_TYPES = new Set(['email', 'family-name', 'given-name', 'phone', 'text-area', 'text-input'])

function isTruthy(value: FieldValue | undefined): boolean {
  if (typeof value === 'boolean') return value
  return ['true', '1', 'yes'].includes(String(value ?? '').toLowerCase())
}

function evaluateRule(rule: ConditionRule, source: FormField, value: FieldValue | undefined): boolean {
  switch (source.type) {
    case 'checkboxes': {
      const selected = Array.isArray(value) ? value : []
      if (rule.operator === 'includes') return selected.includes(rule.value)
      if (rule.operator === 'excludes') return !selected.includes(rule.value)
      return false
    }
    case 'radios':
    case 'select': {
      const current = typeof value === 'string' ? value : ''
      if (rule.operator === 'equals') return current === rule.value
      if (rule.operator === 'notEquals') return current !== rule.value
      return false
    }
    case 'bool':
    case 'newsletter':
      return rule.operator === 'equals' && isTruthy(value) === (rule.value === 'true')
    default: {
      if (!FREE_TEXT_TYPES.has(source.type)) return false
      const matches =
        String(value ?? '')
          .trim()
          .toLowerCase() === rule.value.trim().toLowerCase()
      if (rule.operator === 'equals') return matches
      if (rule.operator === 'notEquals') return !matches
      return false
    }
  }
}

// Mirrors the backend's evaluateConditions. No conditions, or no rules, means always shown.
export function isFieldVisible(
  field: FormField,
  fieldsBySlug: Map<string, FormField>,
  values: Record<string, FieldValue>,
): boolean {
  const conditions = parseMetadata(field.metadata).conditions
  if (!conditions || conditions.rules.length === 0) return true

  const check = (rule: ConditionRule) => {
    const source = fieldsBySlug.get(rule.field)
    return source ? evaluateRule(rule, source, values[rule.field]) : false
  }

  return conditions.match === 'any' ? conditions.rules.some(check) : conditions.rules.every(check)
}
