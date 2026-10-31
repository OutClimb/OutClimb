'use client'

import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Plus, Trash2 } from 'lucide-react'
import { conditionOperatorsFor, fieldOptions, isBoolField, isChoiceField, newConditionRule } from '@/lib/form-field'
import type { ConditionOperator, ConditionRule, FieldConditions, FormField } from '@/types/form'

const OPERATOR_LABELS: Record<ConditionOperator, string> = {
  equals: 'is',
  notEquals: 'is not',
  includes: 'includes',
  excludes: 'does not include',
}

const BOOL_LABELS: Record<string, string> = { true: 'Checked', false: 'Not checked' }

export interface FieldConditionsEditorProps {
  conditions: FieldConditions | null
  // Fields that can be used as a source: non-content fields without conditions of their own.
  sources: Array<FormField>
  // Set when other fields already use this field as a source, which stops it from having conditions.
  usedAsSource: boolean
  error: string
  onChange: (conditions: FieldConditions | null) => void
}

export function FieldConditionsEditor({
  conditions,
  sources,
  usedAsSource,
  error,
  onChange,
}: FieldConditionsEditorProps) {
  const sourceBySlug = new Map(sources.map((s) => [s.slug, s]))
  const disabled = usedAsSource || sources.length === 0

  const handleToggle = (checked: boolean) => {
    if (!checked) return onChange(null)
    onChange({ match: 'all', rules: [newConditionRule(sources[0])] })
  }

  const updateRule = (index: number, rule: ConditionRule) => {
    if (!conditions) return
    onChange({ ...conditions, rules: conditions.rules.map((r, i) => (i === index ? rule : r)) })
  }

  const handleSourceChange = (index: number, slug: string) => {
    const source = sourceBySlug.get(slug)
    if (source) updateRule(index, newConditionRule(source))
  }

  const removeRule = (index: number) => {
    if (!conditions) return
    const rules = conditions.rules.filter((_, i) => i !== index)
    onChange(rules.length ? { ...conditions, rules } : null)
  }

  const addRule = () => {
    if (conditions) onChange({ ...conditions, rules: [...conditions.rules, newConditionRule(sources[0])] })
  }

  return (
    <div className="flex flex-col gap-4">
      <Field orientation="horizontal">
        <FieldLabel htmlFor="field-conditional">Show only when…</FieldLabel>
        <Switch
          id="field-conditional"
          checked={!!conditions}
          disabled={disabled && !conditions}
          onCheckedChange={handleToggle}
        />
      </Field>

      {usedAsSource && (
        <FieldDescription>
          Other fields depend on this field, so it can&apos;t have conditions of its own
        </FieldDescription>
      )}
      {!usedAsSource && sources.length === 0 && !conditions && (
        <FieldDescription>
          Add a field to base this on first. Fields with conditions can&apos;t be used
        </FieldDescription>
      )}

      {conditions && (
        <>
          <Field orientation="horizontal">
            <FieldLabel htmlFor="field-conditions-match">Show when</FieldLabel>
            <Select
              value={conditions.match}
              onValueChange={(match) => onChange({ ...conditions, match: match as FieldConditions['match'] })}>
              <SelectTrigger id="field-conditions-match" className="w-auto">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All rules match</SelectItem>
                <SelectItem value="any">Any rule matches</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          {conditions.rules.map((rule, index) => {
            const source = sourceBySlug.get(rule.field)
            const operators = source ? conditionOperatorsFor(source.type) : []
            const options = source && isChoiceField(source.type) ? fieldOptions(source.metadata) : []

            return (
              <div key={index} className="flex flex-col gap-2 rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <Select value={rule.field} onValueChange={(slug) => handleSourceChange(index, slug)}>
                    <SelectTrigger className="w-full" aria-label="Source field" aria-invalid={!source}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sources.map((s) => (
                        <SelectItem key={s.slug} value={s.slug}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    type="button"
                    className="shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => removeRule(index)}
                    aria-label="Remove rule">
                    <Trash2 />
                  </Button>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <Select
                    value={rule.operator}
                    onValueChange={(operator) =>
                      updateRule(index, { ...rule, operator: operator as ConditionOperator })
                    }>
                    <SelectTrigger className="w-full" aria-label="Operator">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {operators.map((op) => (
                        <SelectItem key={op} value={op}>
                          {OPERATOR_LABELS[op]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {source && isBoolField(source.type) ? (
                    <Select value={rule.value} onValueChange={(value) => updateRule(index, { ...rule, value })}>
                      <SelectTrigger className="w-full" aria-label="Value">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(BOOL_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : source && isChoiceField(source.type) ? (
                    <Select value={rule.value} onValueChange={(value) => updateRule(index, { ...rule, value })}>
                      <SelectTrigger className="w-full" aria-label="Value">
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                      <SelectContent>
                        {options.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={rule.value}
                      onChange={(e) => updateRule(index, { ...rule, value: e.target.value })}
                      placeholder="Value"
                      aria-label="Value"
                    />
                  )}
                </div>
              </div>
            )
          })}

          <Button
            variant="outline"
            size="sm"
            type="button"
            disabled={sources.length === 0}
            className="self-start"
            onClick={addRule}>
            <Plus />
            Add Rule
          </Button>
        </>
      )}

      {error && <FieldError>{error}</FieldError>}
    </div>
  )
}
