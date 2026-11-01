import {
  conditionOperatorsFor,
  fieldConditions,
  fieldOptions,
  isBoolField,
  isChoiceField,
  isContentField,
} from '@/lib/form-field'
import type { ConditionRule, FieldConditions, FormField } from '@/types/form'

// Returns the field's metadata with its conditions replaced. Null conditions drop the key, and empty metadata becomes null.
function withConditions(metadata: string | null, conditions: FieldConditions | null): string | null {
  let meta: Record<string, unknown> = {}
  try {
    const parsed = metadata ? JSON.parse(metadata) : {}
    if (parsed && typeof parsed === 'object') meta = parsed
  } catch {
    // Unreadable metadata is treated as empty, the same as the builder does.
  }

  if (conditions) meta.conditions = conditions
  else delete meta.conditions

  return Object.keys(meta).length ? JSON.stringify(meta) : null
}

function updateRules(
  fields: Array<FormField>,
  update: (rules: Array<ConditionRule>, field: FormField) => Array<ConditionRule>,
): Array<FormField> {
  return fields.map((field) => {
    const conditions = fieldConditions(field.metadata)
    if (!conditions) return field

    const rules = update(conditions.rules, field)
    if (rules === conditions.rules) return field

    return { ...field, metadata: withConditions(field.metadata, rules.length ? { ...conditions, rules } : null) }
  })
}

// Fields that have at least one rule using the given slug as its source.
export function findDependents(fields: Array<FormField>, slug: string): Array<FormField> {
  return fields.filter((f) => fieldConditions(f.metadata)?.rules.some((r) => r.field === slug))
}

// Points every rule using oldSlug at newSlug.
export function renameConditionSource(fields: Array<FormField>, oldSlug: string, newSlug: string): Array<FormField> {
  if (oldSlug === newSlug) return fields

  return updateRules(fields, (rules) =>
    rules.some((r) => r.field === oldSlug)
      ? rules.map((r) => (r.field === oldSlug ? { ...r, field: newSlug } : r))
      : rules,
  )
}

// A rule is broken when its source is gone or is a content field, the operator isn't allowed for the source's
// type, or the value is no longer one of the source's options. Mirrors the backend's validateFieldConditions.
function isBrokenRule(rule: ConditionRule, sourceBySlug: Map<string, FormField>): boolean {
  const source = sourceBySlug.get(rule.field)
  if (!source || isContentField(source.type)) return true
  if (!conditionOperatorsFor(source.type).includes(rule.operator)) return true
  if (isBoolField(source.type)) return rule.value !== 'true' && rule.value !== 'false'
  if (isChoiceField(source.type)) return !fieldOptions(source.metadata).includes(rule.value)
  return false
}

function sourcesBySlug(fields: Array<FormField>): Map<string, FormField> {
  return new Map(fields.map((f) => [f.slug, f]))
}

// Fields that have at least one broken rule.
export function findBrokenDependents(fields: Array<FormField>): Array<FormField> {
  const sourceBySlug = sourcesBySlug(fields)
  return fields.filter((f) => fieldConditions(f.metadata)?.rules.some((r) => isBrokenRule(r, sourceBySlug)))
}

// Removes broken rules. A field left with no rules loses its conditions.
export function stripBrokenRules(fields: Array<FormField>): Array<FormField> {
  const sourceBySlug = sourcesBySlug(fields)

  return updateRules(fields, (rules) => {
    const kept = rules.filter((r) => !isBrokenRule(r, sourceBySlug))
    return kept.length === rules.length ? rules : kept
  })
}
