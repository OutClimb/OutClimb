'use client'

import authGuard from '@/lib/auth-guard'
import { Content } from '@/components/content'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { fetchForm, updateForm } from '@/api/form'
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

export const Route = createFileRoute('/manage_/form_/$id/edit')({
  component: EditForm,
  head: () => ({
    meta: [{ title: 'Edit Form | OutClimb Management' }],
  }),
  beforeLoad: ({ context, location }) =>
    Promise.all([authGuard(context, location), permissionGuard(context, 'form', WRITE_PERMISSION)]),
})

function EditForm() {
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
        populateSingle(fetched)
        setForm(fetched)
      } catch (error) {
        if (error instanceof UnauthorizedError) {
          navigate({ to: '/manage/login' })
        }
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [slug, token, populateSingle, navigate])

  const handleSave = async (payload: FormEditorPayload) => {
    if (!form) return
    try {
      const updated = await updateForm(token ?? '', { id: form.id, ...payload })
      populateSingle(updated)
      navigate({ to: '/manage/form' })
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        navigate({ to: '/manage/login' })
      }
    }
  }

  return (
    <>
      <Header backTo="/manage/form">Edit Form</Header>

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
          <FormEditor initialForm={form} onSave={handleSave} submitLabel="Save" submitLoadingLabel="Saving..." />
        )}
      </Content>
    </>
  )
}
