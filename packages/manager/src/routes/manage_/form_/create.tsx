'use client'

import authGuard from '@/lib/auth-guard'
import { createForm } from '@/api/form'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Content } from '@/components/content'
import { FormEditor } from '@/components/form/form-editor'
import { Header } from '@/components/header'
import permissionGuard from '@/lib/permission-guard'
import { UnauthorizedError } from '@/errors/unauthorized'
import useFormStore from '@/stores/form'
import useSelfStore, { WRITE_PERMISSION } from '@/stores/self'
import type { FormEditorPayload } from '@/components/form/form-editor'

export const Route = createFileRoute('/manage_/form_/create')({
  component: CreateForm,
  head: () => ({
    meta: [{ title: 'Create Form | OutClimb Management' }],
  }),
  beforeLoad: ({ context, location }) =>
    Promise.all([authGuard(context, location), permissionGuard(context, 'form', WRITE_PERMISSION)]),
})

function CreateForm() {
  const navigate = useNavigate()
  const { token } = useSelfStore()
  const { populateSingle } = useFormStore()

  const handleSave = async (payload: FormEditorPayload) => {
    try {
      const form = await createForm(token ?? '', { id: 0, ...payload })
      populateSingle(form)
      navigate({ to: '/manage/form' })
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        navigate({ to: '/manage/login' })
      }
    }
  }

  return (
    <>
      <Header backTo="/manage/form">Create Form</Header>
      <Content>
        <FormEditor onSave={handleSave} submitLabel="Create" submitLoadingLabel="Creating..." />
      </Content>
    </>
  )
}
