'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { fetchEmails } from '@/api/email'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { FormFieldBuilder } from '@/components/form/form-field-builder'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { UnauthorizedError } from '@/errors/unauthorized'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import useEmailStore from '@/stores/email'
import useSelfStore from '@/stores/self'
import type { Form, FormField } from '@/types/form'

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function datetimeLocalToUnix(value: string): number | null {
  if (!value.trim()) return null
  const ms = new Date(value).getTime()
  return isNaN(ms) ? null : Math.floor(ms / 1000)
}

function unixToDatetimeLocal(ts: number | null | undefined): string {
  if (!ts) return ''
  return new Date(ts * 1000).toISOString().slice(0, 16)
}

function stringToUint(value: string): number | null {
  const n = parseInt(value, 10)
  return isNaN(n) || n < 1 ? null : n
}

function nullableString(value: string): string | null {
  return value.trim() || null
}

interface EditorData {
  name: string
  slug: string
  slugManuallyEdited: boolean
  opensOn: string
  closesOn: string
  maxSubmissions: string
  notOpenMessage: string
  closedMessage: string
  filledMessage: string
  successMessage: string
  notificationEmailTo: string
  notificationEmailSlug: string
  confirmationEmailFieldSlug: string
  confirmationEmailSlug: string
}

interface EditorErrors {
  name: string
  slug: string
  opensOn: string
  closesOn: string
  maxSubmissions: string
}

const emptyData: EditorData = {
  name: '',
  slug: '',
  slugManuallyEdited: false,
  opensOn: '',
  closesOn: '',
  maxSubmissions: '',
  notOpenMessage: '',
  closedMessage: '',
  filledMessage: '',
  successMessage: '',
  notificationEmailTo: '',
  notificationEmailSlug: '',
  confirmationEmailFieldSlug: '',
  confirmationEmailSlug: '',
}

const emptyErrors: EditorErrors = {
  name: '',
  slug: '',
  opensOn: '',
  closesOn: '',
  maxSubmissions: '',
}

function dataFromForm(form: Form): EditorData {
  return {
    name: form.name,
    slug: form.slug,
    slugManuallyEdited: true,
    opensOn: unixToDatetimeLocal(form.opensOn),
    closesOn: unixToDatetimeLocal(form.closesOn),
    maxSubmissions: form.maxSubmissions?.toString() ?? '',
    notOpenMessage: form.notOpenMessage ?? '',
    closedMessage: form.closedMessage ?? '',
    filledMessage: form.filledMessage ?? '',
    successMessage: form.successMessage ?? '',
    notificationEmailTo: form.notificationEmailTo ?? '',
    notificationEmailSlug: form.notificationEmailSlug ?? '',
    confirmationEmailFieldSlug: form.confirmationEmailFieldSlug ?? '',
    confirmationEmailSlug: form.confirmationEmailSlug ?? '',
  }
}

export interface FormEditorPayload {
  name: string
  slug: string
  opensOn: number | null
  closesOn: number | null
  maxSubmissions: number | null
  notOpenMessage: string | null
  closedMessage: string | null
  filledMessage: string | null
  successMessage: string | null
  notificationEmailTo: string | null
  notificationEmailSlug: string | null
  confirmationEmailFieldSlug: string | null
  confirmationEmailSlug: string | null
  viewableBy: Array<number>
  fields: Array<FormField>
}

export interface FormEditorProps {
  initialForm?: Form
  onSave: (payload: FormEditorPayload) => Promise<void>
  submitLabel: string
  submitLoadingLabel: string
}

export function FormEditor({ initialForm, onSave, submitLabel, submitLoadingLabel }: FormEditorProps) {
  const navigate = useNavigate()
  const { token } = useSelfStore()
  const { list: emailList, populate: populateEmails } = useEmailStore()

  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<EditorData>(() => (initialForm ? dataFromForm(initialForm) : emptyData))
  const [formErrors, setFormErrors] = useState<EditorErrors>(emptyErrors)
  const [fields, setFields] = useState<Array<FormField>>(() => initialForm?.fields ?? [])

  const emailsFetched = useRef(false)
  useEffect(() => {
    if (emailsFetched.current) return
    emailsFetched.current = true
    fetchEmails(token ?? '')
      .then(populateEmails)
      .catch((error) => {
        if (error instanceof UnauthorizedError) {
          navigate({ to: '/manage/login' })
        }
      })
  }, [token, populateEmails, navigate])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }, [])

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    setFormData((prev) => ({
      ...prev,
      name,
      slug: prev.slugManuallyEdited ? prev.slug : slugify(name),
    }))
  }, [])

  const handleSlugChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, slug: e.target.value, slugManuallyEdited: true }))
  }, [])

  const handleSubmit = useCallback(
    async (e: React.SubmitEvent<HTMLFormElement>) => {
      e.preventDefault()

      const errors: EditorErrors = { ...emptyErrors }
      let hasError = false

      if (!formData.name.trim()) {
        errors.name = 'Please fill in this field'
        hasError = true
      }

      if (!formData.slug.trim()) {
        errors.slug = 'Please fill in this field'
        hasError = true
      } else if (!/^[a-z0-9-]+$/.test(formData.slug.trim())) {
        errors.slug = 'Slug may only contain lowercase letters, numbers, and hyphens'
        hasError = true
      }

      if (formData.opensOn && isNaN(new Date(formData.opensOn).getTime())) {
        errors.opensOn = 'Invalid date'
        hasError = true
      }

      if (formData.closesOn && isNaN(new Date(formData.closesOn).getTime())) {
        errors.closesOn = 'Invalid date'
        hasError = true
      }

      if (formData.maxSubmissions && stringToUint(formData.maxSubmissions) === null) {
        errors.maxSubmissions = 'Must be a positive number'
        hasError = true
      }

      setFormErrors(errors)
      if (hasError) return

      setIsLoading(true)
      try {
        await onSave({
          name: formData.name.trim(),
          slug: formData.slug.trim(),
          opensOn: datetimeLocalToUnix(formData.opensOn),
          closesOn: datetimeLocalToUnix(formData.closesOn),
          maxSubmissions: stringToUint(formData.maxSubmissions),
          notOpenMessage: nullableString(formData.notOpenMessage),
          closedMessage: nullableString(formData.closedMessage),
          filledMessage: nullableString(formData.filledMessage),
          successMessage: nullableString(formData.successMessage),
          notificationEmailTo: nullableString(formData.notificationEmailTo),
          notificationEmailSlug: nullableString(formData.notificationEmailSlug),
          confirmationEmailFieldSlug: nullableString(formData.confirmationEmailFieldSlug),
          confirmationEmailSlug: nullableString(formData.confirmationEmailSlug),
          viewableBy: initialForm?.viewableBy ?? [],
          fields,
        })
      } finally {
        setIsLoading(false)
      }
    },
    [formData, fields, onSave, initialForm],
  )

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleNameChange}
                disabled={isLoading}
              />
              {formErrors.name && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{formErrors.name}</AlertDescription>
                </Alert>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="slug">Slug</FieldLabel>
              <Input
                id="slug"
                name="slug"
                type="text"
                value={formData.slug}
                onChange={handleSlugChange}
                disabled={isLoading}
              />
              {formErrors.slug && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{formErrors.slug}</AlertDescription>
                </Alert>
              )}
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Availability</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="opensOn">Opens On</FieldLabel>
              <FieldDescription>Leave blank to open immediately</FieldDescription>
              <Input
                id="opensOn"
                name="opensOn"
                type="datetime-local"
                value={formData.opensOn}
                onChange={handleChange}
                disabled={isLoading}
              />
              {formErrors.opensOn && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{formErrors.opensOn}</AlertDescription>
                </Alert>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="closesOn">Closes On</FieldLabel>
              <FieldDescription>Leave blank to never close</FieldDescription>
              <Input
                id="closesOn"
                name="closesOn"
                type="datetime-local"
                value={formData.closesOn}
                onChange={handleChange}
                disabled={isLoading}
              />
              {formErrors.closesOn && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{formErrors.closesOn}</AlertDescription>
                </Alert>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="maxSubmissions">Max Submissions</FieldLabel>
              <FieldDescription>Leave blank for unlimited</FieldDescription>
              <Input
                id="maxSubmissions"
                name="maxSubmissions"
                type="number"
                min="1"
                value={formData.maxSubmissions}
                onChange={handleChange}
                disabled={isLoading}
              />
              {formErrors.maxSubmissions && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{formErrors.maxSubmissions}</AlertDescription>
                </Alert>
              )}
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Messages</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="notOpenMessage">Not Open Message</FieldLabel>
              <FieldDescription>Shown when the form has not opened yet</FieldDescription>
              <Textarea
                id="notOpenMessage"
                name="notOpenMessage"
                value={formData.notOpenMessage}
                onChange={handleChange}
                disabled={isLoading}
                rows={3}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="closedMessage">Closed Message</FieldLabel>
              <FieldDescription>Shown when the form has closed</FieldDescription>
              <Textarea
                id="closedMessage"
                name="closedMessage"
                value={formData.closedMessage}
                onChange={handleChange}
                disabled={isLoading}
                rows={3}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="filledMessage">Filled Message</FieldLabel>
              <FieldDescription>Shown when max submissions has been reached</FieldDescription>
              <Textarea
                id="filledMessage"
                name="filledMessage"
                value={formData.filledMessage}
                onChange={handleChange}
                disabled={isLoading}
                rows={3}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="successMessage">Success Message</FieldLabel>
              <FieldDescription>Shown after a successful submission</FieldDescription>
              <Textarea
                id="successMessage"
                name="successMessage"
                value={formData.successMessage}
                onChange={handleChange}
                disabled={isLoading}
                rows={3}
              />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fields</CardTitle>
        </CardHeader>
        <CardContent>
          <FormFieldBuilder fields={fields} onChange={setFields} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="notificationEmailTo">Notification Email To</FieldLabel>
              <FieldDescription>Address to notify on each new submission</FieldDescription>
              <Input
                id="notificationEmailTo"
                name="notificationEmailTo"
                type="email"
                value={formData.notificationEmailTo}
                onChange={handleChange}
                disabled={isLoading}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="notificationEmailSlug">Notification Email Template</FieldLabel>
              <FieldDescription>Email template to use for notifications</FieldDescription>
              <Select
                value={formData.notificationEmailSlug}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, notificationEmailSlug: value === '_none' ? '' : value }))
                }
                disabled={isLoading}>
                <SelectTrigger id="notificationEmailSlug" className="w-full">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">None</SelectItem>
                  {emailList().map((email) => (
                    <SelectItem key={email.id} value={email.slug}>
                      {email.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="confirmationEmailFieldSlug">Confirmation Email Field</FieldLabel>
              <FieldDescription>Form field that holds the submitter's email address</FieldDescription>
              <Select
                value={formData.confirmationEmailFieldSlug}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    confirmationEmailFieldSlug: value === '_none' ? '' : value,
                  }))
                }
                disabled={isLoading || fields.filter((f) => f.type === 'email').length === 0}>
                <SelectTrigger id="confirmationEmailFieldSlug" className="w-full">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">None</SelectItem>
                  {fields
                    .filter((f) => f.type === 'email')
                    .map((f) => (
                      <SelectItem key={f.slug} value={f.slug}>
                        {f.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="confirmationEmailSlug">Confirmation Email Template</FieldLabel>
              <FieldDescription>Email template to send to the submitter</FieldDescription>
              <Select
                value={formData.confirmationEmailSlug}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, confirmationEmailSlug: value === '_none' ? '' : value }))
                }
                disabled={isLoading}>
                <SelectTrigger id="confirmationEmailSlug" className="w-full">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">None</SelectItem>
                  {emailList().map((email) => (
                    <SelectItem key={email.id} value={email.slug}>
                      {email.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
        </CardContent>

        <CardFooter>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Spinner /> {submitLoadingLabel}
              </>
            ) : (
              submitLabel
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
