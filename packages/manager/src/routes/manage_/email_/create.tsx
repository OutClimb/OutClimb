'use client'

import authGuard from '@/lib/auth-guard'
import { createEmail } from '@/api/email'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Header } from '@/components/header'
import permissionGuard from '@/lib/permission-guard'
import { UnauthorizedError } from '@/errors/unauthorized'
import { useCallback, useState } from 'react'
import useEmailStore from '@/stores/email'
import useSelfStore, { WRITE_PERMISSION } from '@/stores/self'
import { Content } from '@/components/content'
import { EmailEditor } from '@/components/email/email-editor'

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
      <Header isLoading={isLoading} backTo="/manage/email">
        Create Email
      </Header>

      <Content>
        <EmailEditor
          data={formData}
          errors={formErrors}
          isLoading={isLoading}
          onChange={handleChange}
          onSubmit={handleSubmit}
          submitLabel="Create"
          submitLoadingLabel="Creating..."
        />
      </Content>
    </>
  )
}
