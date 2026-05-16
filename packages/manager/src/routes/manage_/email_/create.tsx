'use client'

import authGuard from '@/lib/auth-guard'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { createEmail } from '@/api/email'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Field, FieldLabel } from '@/components/ui/field'
import { Header } from '@/components/header'
import { Input } from '@/components/ui/input'
import permissionGuard from '@/lib/permission-guard'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { UnauthorizedError } from '@/errors/unauthorized'
import { useCallback, useState } from 'react'
import useEmailStore from '@/stores/email'
import useSelfStore, { WRITE_PERMISSION } from '@/stores/self'
import { Content } from '@/components/content'

export const Route = createFileRoute('/manage_/email_/create')({
  component: CreateEmail,
  head: () => ({
    meta: [
      {
        title: 'Create Email | OutClimb Management',
      },
    ],
  }),
  beforeLoad: ({ context, location }) =>
    Promise.all([authGuard(context, location), permissionGuard(context, 'email', WRITE_PERMISSION)]),
})

interface FormData {
  name: string
  slug: string
  subject: string
  htmlBody: string
  textBody: string
}

interface FormErrors {
  name: string
  slug: string
  subject: string
  htmlBody: string
  textBody: string
}

function CreateEmail() {
  const navigate = useNavigate()
  const { token } = useSelfStore()
  const { populateSingle } = useEmailStore()

  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [formErrors, setFormErrors] = useState<FormErrors>({
    name: '',
    slug: '',
    subject: '',
    htmlBody: '',
    textBody: '',
  })
  const [formData, setFormData] = useState<FormData>({
    name: '',
    slug: '',
    subject: '',
    htmlBody: '',
    textBody: '',
  })

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target
      setFormData((prev) => ({ ...prev, [name]: value }))
    },
    [setFormData],
  )

  const handleSubmit = useCallback(
    async (e: React.SubmitEvent<HTMLFormElement>) => {
      e.preventDefault()

      const errors: FormErrors = { name: '', slug: '', subject: '', htmlBody: '', textBody: '' }
      let hasError = false

      if (!formData.name.trim()) {
        errors.name = 'Please fill in this field'
        hasError = true
      }

      if (!formData.slug.trim()) {
        errors.slug = 'Please fill in this field'
        hasError = true
      }

      if (!formData.subject.trim()) {
        errors.subject = 'Please fill in this field'
        hasError = true
      }

      if (!formData.htmlBody.trim()) {
        errors.htmlBody = 'Please fill in this field'
        hasError = true
      }

      if (!formData.textBody.trim()) {
        errors.textBody = 'Please fill in this field'
        hasError = true
      }

      setFormErrors(errors)

      if (!hasError) {
        setIsLoading(true)
        try {
          const email = await createEmail(token || '', {
            id: 0,
            name: formData.name.trim(),
            slug: formData.slug.trim(),
            subject: formData.subject.trim(),
            htmlBody: formData.htmlBody.trim(),
            textBody: formData.textBody.trim(),
          })
          populateSingle(email)
          navigate({ to: '/manage/email' })
        } catch (error) {
          if (error instanceof UnauthorizedError) {
            navigate({ to: '/manage/login' })
          }
        } finally {
          setIsLoading(false)
        }
      }
    },
    [formData, token, populateSingle, navigate],
  )

  return (
    <>
      <Header>Create Email</Header>

      <Content>
        <Card>
          <form onSubmit={handleSubmit}>
            <CardContent className="flex flex-col gap-4 pb-4">
              <Field>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
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
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                />
                {formErrors.slug && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{formErrors.slug}</AlertDescription>
                  </Alert>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="subject">Subject</FieldLabel>
                <Input
                  id="subject"
                  name="subject"
                  type="text"
                  value={formData.subject}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                />
                {formErrors.subject && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{formErrors.subject}</AlertDescription>
                  </Alert>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="htmlBody">HTML Body</FieldLabel>
                <Textarea
                  id="htmlBody"
                  name="htmlBody"
                  className="min-h-64 font-mono text-sm"
                  value={formData.htmlBody}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                />
                {formErrors.htmlBody && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{formErrors.htmlBody}</AlertDescription>
                  </Alert>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="textBody">Text Body</FieldLabel>
                <Textarea
                  id="textBody"
                  name="textBody"
                  className="min-h-32 font-mono text-sm"
                  value={formData.textBody}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                />
                {formErrors.textBody && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{formErrors.textBody}</AlertDescription>
                  </Alert>
                )}
              </Field>
            </CardContent>

            <CardFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Spinner /> Creating...
                  </>
                ) : (
                  'Create'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </Content>
    </>
  )
}
