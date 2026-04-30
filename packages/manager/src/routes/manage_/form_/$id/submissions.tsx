'use client'

import authGuard from '@/lib/auth-guard'
import { createFileRoute } from '@tanstack/react-router'
import { Header } from '@/components/header'
import permissionGuard from '@/lib/permission-guard'
import { READ_PERMISSION } from '@/stores/self'
import { Content } from '@/components/content'

export const Route = createFileRoute('/manage_/form_/$id/submissions')({
  component: FormSubmissions,
  head: () => ({
    meta: [
      {
        title: 'Form Submissions | OutClimb Management',
      },
    ],
  }),
  beforeLoad: ({ context, location }) =>
    Promise.all([authGuard(context, location), permissionGuard(context, 'form', READ_PERMISSION)]),
})

function FormSubmissions() {
  // const { id } = Route.useParams()

  return (
    <>
      <Header>Form Submissions</Header>

      <Content></Content>
    </>
  )
}
