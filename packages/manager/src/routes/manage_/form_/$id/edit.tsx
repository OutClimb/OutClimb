'use client'

import authGuard from '@/lib/auth-guard'
import { createFileRoute } from '@tanstack/react-router'
import { Header } from '@/components/header'
import permissionGuard from '@/lib/permission-guard'
import { WRITE_PERMISSION } from '@/stores/self'
import { Content } from '@/components/content'

export const Route = createFileRoute('/manage_/form_/$id/edit')({
  component: EditForm,
  head: () => ({
    meta: [
      {
        title: 'Edit Form | OutClimb Management',
      },
    ],
  }),
  beforeLoad: ({ context, location }) =>
    Promise.all([authGuard(context, location), permissionGuard(context, 'form', WRITE_PERMISSION)]),
})

function EditForm() {
  // const { id } = Route.useParams()

  return (
    <>
      <Header backTo="/manage/form">Edit Form</Header>

      <Content></Content>
    </>
  )
}
