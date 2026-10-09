'use client'

import 'altcha'
import type {} from 'altcha/types/react'
import type { AltchaWidgetElement } from 'altcha/types/generic'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { createSubmission } from '@/api/form'
import { FormField } from '@/components/form-field'
import { initialValue, type FieldValue } from '@/lib/form-field'
import { Button } from '@/components/ui/button'
import { FieldError, FieldGroup } from '@/components/ui/field'
import type { CreateSubmissionRequest, Form } from '@/types/form'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate(type: string, required: boolean, value: FieldValue): string {
  const isEmpty = value === false || (Array.isArray(value) ? value.length === 0 : String(value).trim() === '')
  if (required && isEmpty) {
    return type === 'bool' ? 'Please check this box to continue' : 'Please fill in this field'
  }
  if (type === 'email' && !isEmpty && !EMAIL_PATTERN.test(String(value).trim())) {
    return 'Please enter a valid email address'
  }
  return ''
}

function serialize(value: FieldValue): string {
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (Array.isArray(value)) return value.join(', ')
  return value.trim()
}

export interface RegistrationFormProps {
  form: Form
  onSuccess: () => void
}

export function RegistrationForm({ form, onSuccess }: RegistrationFormProps) {
  const fields = [...form.fields].sort((a, b) => a.order - b.order)
  const [values, setValues] = useState<Record<string, FieldValue>>(() =>
    Object.fromEntries(fields.map((f) => [f.slug, initialValue(f.type)])),
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const altchaRef = useRef<AltchaWidgetElement>(null)
  const altchaPayload = useRef<string | null>(null)
  const honeypotRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const widget = altchaRef.current
    if (!widget) return

    const handleStateChange = (e: Event) => {
      const { payload, state } = (e as CustomEvent<{ payload?: string; state: string }>).detail
      altchaPayload.current = state === 'verified' && payload ? payload : null
    }

    widget.addEventListener('statechange', handleStateChange)
    return () => widget.removeEventListener('statechange', handleStateChange)
  }, [])

  const handleChange = (slug: string, value: FieldValue) => {
    setValues((prev) => ({ ...prev, [slug]: value }))
    setErrors((prev) => (prev[slug] ? { ...prev, [slug]: '' } : prev))
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitError('')

    const nextErrors: Record<string, string> = {}
    for (const field of fields) {
      const error = validate(field.type, field.required, values[field.slug])
      if (error) nextErrors[field.slug] = error
    }
    setErrors(nextErrors)

    const firstInvalid = fields.find((f) => nextErrors[f.slug])
    if (firstInvalid) {
      document.getElementById(`field-${firstInvalid.slug}`)?.focus()
      return
    }

    setSubmitting(true)
    try {
      // The widget usually finishes in the background while the form is filled out.
      const altcha = altchaPayload.current ?? (await altchaRef.current?.verify())?.payload
      if (!altcha) {
        throw new Error("We couldn't verify that you're not a robot. Please try again.")
      }

      const body: CreateSubmissionRequest = {
        values: Object.fromEntries(fields.map((f) => [f.slug, serialize(values[f.slug])])),
        altcha,
        honeypot: honeypotRef.current?.value ?? '',
      }

      await createSubmission(form.slug, body)
      onSuccess()
    } catch (err) {
      // Each solution can only be used once, so start a fresh challenge for the retry.
      altchaPayload.current = null
      altchaRef.current?.reset()
      setSubmitError(err instanceof Error ? err.message : 'An error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit}>
      <FieldGroup className="gap-4">
        {fields.map((field) => (
          <FormField
            key={field.slug}
            field={field}
            value={values[field.slug]}
            error={errors[field.slug]}
            disabled={submitting}
            onChange={(value) => handleChange(field.slug, value)}
          />
        ))}

        {/* Honeypot: hidden from people, but bots tend to fill in every field. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label htmlFor="website">Website</label>
          <input ref={honeypotRef} id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        <altcha-widget
          ref={altchaRef}
          challenge="/api/v1/captcha"
          auto="onfocus"
          style={{
            '--altcha-max-width': '100%',
            '--altcha-color-base': 'var(--color-white)',
            '--altcha-border-radius': 'var(--radius-lg)',
            '--altcha-color-primary': 'var(--primary)',
          }}
        />

        {submitError && <FieldError className="text-center">{submitError}</FieldError>}

        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit'}
        </Button>
      </FieldGroup>
    </form>
  )
}
