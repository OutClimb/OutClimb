import type { ConditionOperator, ConditionRule, FieldConditions, FormField } from '@/types/form'

export const CONTENT_FIELD_TYPES = new Set(['subheader', 'divider', 'paragraph'])

export function isContentField(type: string): boolean {
  return CONTENT_FIELD_TYPES.has(type)
}

const FREE_TEXT_FIELD_TYPES = new Set(['email', 'family-name', 'given-name', 'phone', 'text-area', 'text-input'])
const CHOICE_FIELD_TYPES = new Set(['checkboxes', 'radios', 'select'])

// Mirrors the backend's allowedConditionOperators.
export function conditionOperatorsFor(type: string): Array<ConditionOperator> {
  if (type === 'checkboxes') return ['includes', 'excludes']
  if (type === 'bool' || type === 'newsletter') return ['equals']
  if (type === 'radios' || type === 'select' || FREE_TEXT_FIELD_TYPES.has(type)) return ['equals', 'notEquals']
  return []
}

export function isChoiceField(type: string): boolean {
  return CHOICE_FIELD_TYPES.has(type)
}

export function isBoolField(type: string): boolean {
  return type === 'bool' || type === 'newsletter'
}

export function fieldOptions(metadata: string | null): Array<string> {
  if (!metadata) return []
  try {
    const options = JSON.parse(metadata)?.options
    return Array.isArray(options) ? (options as Array<string>) : []
  } catch {
    return []
  }
}

// Reads the conditions key out of a field's metadata. Fields without usable conditions return null.
export function fieldConditions(metadata: string | null): FieldConditions | null {
  if (!metadata) return null
  try {
    const conditions = JSON.parse(metadata)?.conditions
    return Array.isArray(conditions?.rules) && conditions.rules.length > 0 ? (conditions as FieldConditions) : null
  } catch {
    return null
  }
}

// A fresh rule on the given source, with its first allowed operator and an empty value ("true" for bool sources).
export function newConditionRule(source: FormField): ConditionRule {
  return {
    field: source.slug,
    operator: conditionOperatorsFor(source.type)[0],
    value: isBoolField(source.type) ? 'true' : '',
  }
}
