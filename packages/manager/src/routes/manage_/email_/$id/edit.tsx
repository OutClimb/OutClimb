'use client'

import authGuard from '@/lib/auth-guard'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Content } from '@/components/content'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { fetchEmails, updateEmail } from '@/api/email'
import { Field, FieldLabel } from '@/components/ui/field'
import { Header } from '@/components/header'
import { Input } from '@/components/ui/input'
import { Mail } from 'lucide-react'
import permissionGuard from '@/lib/permission-guard'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { UnauthorizedError } from '@/errors/unauthorized'
import { useCallback, useEffect, useState } from 'react'
import useEmailStore from '@/stores/email'
import useSelfStore, { WRITE_PERMISSION } from '@/stores/self'

export const Route = createFileRoute('/manage_/email_/$id/edit')({
  component: EditEmail,
  head: () => ({
    meta: [
      {
        title: 'Edit Email | OutClimb Management',
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

const emptyErrors: FormErrors = { name: '', slug: '', subject: '', htmlBody: '', textBody: '' }

function EditEmail() {
  const { id: idParam } = Route.useParams()
  const id = Number(idParam)
  const navigate = useNavigate()
  const { token } = useSelfStore()
  const { data, isEmpty, populate, populateSingle } = useEmailStore()

  const [isHydrated, setIsHydrated] = useState<boolean>(() => !isEmpty())
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [formErrors, setFormErrors] = useState<FormErrors>(emptyErrors)
  const [formData, setFormData] = useState<FormData>(() => {
    const existing = data[id]
    if (existing) {
      return {
        name: existing.name,
        slug: existing.slug,
        subject: existing.subject,
        htmlBody: existing.htmlBody,
        textBody: existing.textBody,
      }
    }
    return { name: '', slug: '', subject: '', htmlBody: '', textBody: '' }
  })

  useEffect(() => {
    if (isHydrated) return

    const load = async () => {
      setIsLoading(true)
      try {
        const emails = await fetchEmails(token || '')
        populate(emails)
        const found = emails.find((e) => e.id === id)
        if (found) {
          setFormData({
            name: found.name,
            slug: found.slug,
            subject: found.subject,
            htmlBody: found.htmlBody,
            textBody: found.textBody,
          })
        }
      } catch (error) {
        if (error instanceof UnauthorizedError) {
          navigate({ to: '/manage/login' })
        }
      } finally {
        setIsHydrated(true)
        setIsLoading(false)
      }
    }

    load()
  }, [isHydrated, id, token, populate, navigate])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }, [])

  const handleSubmit = useCallback(
    async (e: React.SubmitEvent<HTMLFormElement>) => {
      e.preventDefault()

      const errors: FormErrors = { ...emptyErrors }
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
          const email = await updateEmail(token || '', {
            id,
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
    [id, formData, token, populateSingle, navigate],
  )

  const email = data[id]

  return (
    <>
      <Header backTo="/manage/email">Edit Email</Header>

      <Content>
        <Card>
          {isLoading && !email && (
            <CardContent className="p-0">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Spinner />
                  </EmptyMedia>
                  <EmptyTitle>Loading...</EmptyTitle>
                </EmptyHeader>
              </Empty>
            </CardContent>
          )}

          {!isLoading && !email && (
            <CardContent className="p-0">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Mail />
                  </EmptyMedia>
                  <EmptyTitle>Email not found</EmptyTitle>
                </EmptyHeader>
              </Empty>
            </CardContent>
          )}

          {email && (
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
                      <Spinner /> Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </Content>
    </>
  )
}
