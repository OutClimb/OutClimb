'use client'

import authGuard from '@/lib/auth-guard'
import { Card, CardContent } from '@/components/ui/card'
import { Content } from '@/components/content'
import { EmailEditor } from '@/components/email/email-editor'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { fetchEmails, updateEmail } from '@/api/email'
import { Header } from '@/components/header'
import { Mail } from 'lucide-react'
import permissionGuard from '@/lib/permission-guard'
import { Spinner } from '@/components/ui/spinner'
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
      <Header isLoading={isLoading} backTo="/manage/email">
        Edit Email
      </Header>

      <Content>
        {!email && (
          <Card className="p-0">
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
          </Card>
        )}

        {email && (
          <EmailEditor
            data={formData}
            errors={formErrors}
            isLoading={isLoading}
            onChange={handleChange}
            onSubmit={handleSubmit}
            submitLabel="Save"
            submitLoadingLabel="Saving..."
          />
        )}
      </Content>
    </>
  )
}
