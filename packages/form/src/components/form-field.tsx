'use client'

import type { ReactNode } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldContent, FieldError, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { DEFAULT_PLACEHOLDERS, LINK_PATTERN, parseMetadata, type FieldValue } from '@/lib/form-field'
import type { FormField as FormFieldType } from '@/types/form'

// Renders `[text](https://url)` in a field name as a link, so labels like waivers can point somewhere.
function renderName(name: string): ReactNode {
  const parts: Array<ReactNode> = []
  let lastIndex = 0
  for (const match of name.matchAll(LINK_PATTERN)) {
    parts.push(name.slice(lastIndex, match.index))
    parts.push(
      <a
        key={match.index}
        href={match[2]}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline underline-offset-4"
        onClick={(e) => e.stopPropagation()}>
        {match[1]}
      </a>,
    )
    lastIndex = match.index + match[0].length
  }
  parts.push(name.slice(lastIndex))
  return parts
}

function Label({ field, htmlFor }: { field: FormFieldType; htmlFor?: string }) {
  return (
    <FieldLabel htmlFor={htmlFor} className="text-base font-medium">
      <span>
        {renderName(field.name)}
        {field.required && <span aria-hidden="true"> *</span>}
      </span>
    </FieldLabel>
  )
}

export interface FormFieldProps {
  field: FormFieldType
  value: FieldValue
  error?: string
  disabled?: boolean
  onChange: (value: FieldValue) => void
}

export function FormField({ field, value, error, disabled, onChange }: FormFieldProps) {
  const id = `field-${field.slug}`
  const meta = parseMetadata(field.metadata)
  const placeholder = meta.placeholder ?? DEFAULT_PLACEHOLDERS[field.type]
  const invalid = !!error
  const errorNode = error && <FieldError>{error}</FieldError>

  switch (field.type) {
    case 'bool':
    case 'newsletter':
      return (
        <Field orientation="horizontal" data-invalid={invalid}>
          <Checkbox
            id={id}
            checked={value === true}
            onCheckedChange={(checked) => onChange(checked === true)}
            disabled={disabled}
            required={field.required}
            aria-invalid={invalid}
            className="border-gray-400 bg-white"
          />
          <FieldContent>
            <Label field={field} htmlFor={id} />
            {errorNode}
          </FieldContent>
        </Field>
      )

    case 'checkboxes': {
      const selected = Array.isArray(value) ? value : []
      return (
        <FieldSet data-invalid={invalid}>
          <FieldLegend variant="label" className="text-base">
            {renderName(field.name)}
            {field.required && <span aria-hidden="true"> *</span>}
          </FieldLegend>
          {meta.options.map((option, i) => (
            <Field key={option} orientation="horizontal">
              <Checkbox
                id={`${id}-${i}`}
                checked={selected.includes(option)}
                onCheckedChange={(checked) =>
                  onChange(checked ? [...selected, option] : selected.filter((o) => o !== option))
                }
                disabled={disabled}
                aria-invalid={invalid}
                className="border-gray-400 bg-white"
              />
              <FieldLabel htmlFor={`${id}-${i}`} className="text-base font-normal">
                {option}
              </FieldLabel>
            </Field>
          ))}
          {errorNode}
        </FieldSet>
      )
    }

    case 'radios':
      return (
        <FieldSet data-invalid={invalid}>
          <FieldLegend variant="label" className="text-base">
            {renderName(field.name)}
            {field.required && <span aria-hidden="true"> *</span>}
          </FieldLegend>
          <RadioGroup
            value={typeof value === 'string' ? value : ''}
            onValueChange={onChange}
            disabled={disabled}
            required={field.required}
            aria-invalid={invalid}>
            {meta.options.map((option, i) => (
              <Field key={option} orientation="horizontal">
                <RadioGroupItem
                  id={`${id}-${i}`}
                  value={option}
                  aria-invalid={invalid}
                  className="border-gray-400 bg-white"
                />
                <FieldLabel htmlFor={`${id}-${i}`} className="text-base font-normal">
                  {option}
                </FieldLabel>
              </Field>
            ))}
          </RadioGroup>
          {errorNode}
        </FieldSet>
      )

    case 'select':
      return (
        <Field data-invalid={invalid}>
          <Label field={field} htmlFor={id} />
          <Select
            value={typeof value === 'string' ? value : ''}
            onValueChange={onChange}
            disabled={disabled}
            required={field.required}>
            <SelectTrigger id={id} className="h-9 w-full bg-white" aria-invalid={invalid}>
              <SelectValue placeholder={placeholder ?? 'Select an option'} />
            </SelectTrigger>
            <SelectContent>
              {meta.options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errorNode}
        </Field>
      )

    case 'text-area':
      return (
        <Field data-invalid={invalid}>
          <Label field={field} htmlFor={id} />
          <Textarea
            id={id}
            name={field.slug}
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            required={field.required}
            aria-invalid={invalid}
            className="bg-white"
            rows={4}
          />
          {errorNode}
        </Field>
      )

    default: {
      const inputProps: Record<string, Partial<React.ComponentProps<'input'>>> = {
        'given-name': { autoComplete: 'given-name' },
        'family-name': { autoComplete: 'family-name' },
        email: { type: 'email', autoComplete: 'email' },
        phone: { type: 'tel', autoComplete: 'tel' },
      }
      return (
        <Field data-invalid={invalid}>
          <Label field={field} htmlFor={id} />
          <Input
            id={id}
            name={field.slug}
            type="text"
            {...inputProps[field.type]}
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            required={field.required}
            aria-invalid={invalid}
            className="h-9 bg-white"
          />
          {errorNode}
        </Field>
      )
    }
  }
}
