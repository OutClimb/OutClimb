'use client'

import authGuard from '@/lib/auth-guard'
import { Content } from '@/components/content'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { createForm, fetchForm } from '@/api/form'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { FileText } from 'lucide-react'
import { FormEditor } from '@/components/form/form-editor'
import { Header } from '@/components/header'
import permissionGuard from '@/lib/permission-guard'
import { Spinner } from '@/components/ui/spinner'
import { UnauthorizedError } from '@/errors/unauthorized'
import { useEffect, useState } from 'react'
import useFormStore from '@/stores/form'
import useSelfStore, { WRITE_PERMISSION } from '@/stores/self'
import type { Form } from '@/types/form'
import type { FormEditorPayload } from '@/components/form/form-editor'

export const Route = createFileRoute('/manage_/form_/$id/duplicate')({
  component: DuplicateForm,
  head: () => ({
    meta: [{ title: 'Duplicate Form | OutClimb Management' }],
  }),
  beforeLoad: ({ context, location }) =>
    Promise.all([authGuard(context, location), permissionGuard(context, 'form', WRITE_PERMISSION)]),
})

function DuplicateForm() {
  const { id: slug } = Route.useParams()
  const navigate = useNavigate()
  const { token } = useSelfStore()
  const { populateSingle } = useFormStore()

  const [form, setForm] = useState<Form | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const fetched = await fetchForm(token ?? '', slug)
        setForm({
          ...fetched,
          id: 0,
          name: `${fetched.name} (Copy)`,
          slug: `${fetched.slug}-copy`,
          fields: fetched.fields.map((field) => ({ ...field, id: 0 })),
        })
      } catch (error) {
        if (error instanceof UnauthorizedError) {
          navigate({ to: '/manage/login' })
        }
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [slug, token, navigate])

  const handleSave = async (payload: FormEditorPayload) => {
    try {
      const created = await createForm(token ?? '', { id: 0, ...payload })
      populateSingle(created)
      navigate({ to: '/manage/form' })
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        navigate({ to: '/manage/login' })
      }
    }
  }

  return (
    <>
      <Header backTo="/manage/form">Duplicate Form</Header>

      <Content>
        {isLoading && (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Spinner />
              </EmptyMedia>
              <EmptyTitle>Loading...</EmptyTitle>
            </EmptyHeader>
          </Empty>
        )}

        {!isLoading && !form && (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileText />
              </EmptyMedia>
              <EmptyTitle>Form not found</EmptyTitle>
            </EmptyHeader>
          </Empty>
        )}

        {form && (
          <FormEditor initialForm={form} onSave={handleSave} submitLabel="Create" submitLoadingLabel="Creating..." />
        )}
      </Content>
    </>
  )
}
