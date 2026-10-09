'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { FormActions } from '@/components/form-actions'
import { Input } from '@/components/ui/input'
import type React from 'react'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'

export interface EmailEditorData {
  name: string
  slug: string
  subject: string
  htmlBody: string
  textBody: string
}

export interface EmailEditorProps {
  data: EmailEditorData
  errors: EmailEditorData
  isLoading: boolean
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  onSubmit: (e: React.SubmitEvent<HTMLFormElement>) => void
  submitLabel: string
  submitLoadingLabel: string
}

export function EmailEditor({
  data,
  errors,
  isLoading,
  onChange,
  onSubmit,
  submitLabel,
  submitLoadingLabel,
}: EmailEditorProps) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>How this email is identified and the subject line people receive</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={data.name}
                  onChange={onChange}
                  disabled={isLoading}
                  aria-invalid={!!errors.name}
                  required
                />
                <FieldError>{errors.name}</FieldError>
              </Field>

              <Field>
                <FieldLabel htmlFor="slug">Slug</FieldLabel>
                <Input
                  id="slug"
                  name="slug"
                  type="text"
                  value={data.slug}
                  onChange={onChange}
                  disabled={isLoading}
                  aria-invalid={!!errors.slug}
                  required
                />
                <FieldError>{errors.slug}</FieldError>
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="subject">Subject</FieldLabel>
              <Input
                id="subject"
                name="subject"
                type="text"
                value={data.subject}
                onChange={onChange}
                disabled={isLoading}
                aria-invalid={!!errors.subject}
                required
              />
              <FieldError>{errors.subject}</FieldError>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Content</CardTitle>
          <CardDescription>The body of the email</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="htmlBody">HTML Body</FieldLabel>
              <Textarea
                id="htmlBody"
                name="htmlBody"
                className="min-h-80 font-mono text-xs leading-relaxed"
                value={data.htmlBody}
                onChange={onChange}
                disabled={isLoading}
                aria-invalid={!!errors.htmlBody}
                spellCheck={false}
                required
              />
              <FieldError>{errors.htmlBody}</FieldError>
            </Field>

            <Field>
              <FieldLabel htmlFor="textBody">Text Body</FieldLabel>
              <FieldDescription>Plain-text version for email clients that don't display HTML</FieldDescription>
              <Textarea
                id="textBody"
                name="textBody"
                className="min-h-40 font-mono text-xs leading-relaxed"
                value={data.textBody}
                onChange={onChange}
                disabled={isLoading}
                aria-invalid={!!errors.textBody}
                required
              />
              <FieldError>{errors.textBody}</FieldError>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <FormActions>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Spinner /> {submitLoadingLabel}
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </FormActions>
    </form>
  )
}
