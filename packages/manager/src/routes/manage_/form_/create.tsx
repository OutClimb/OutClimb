'use client'

import authGuard from '@/lib/auth-guard'
import { createFileRoute } from '@tanstack/react-router'
import { Header } from '@/components/header'
import permissionGuard from '@/lib/permission-guard'
import { WRITE_PERMISSION } from '@/stores/self'
import { Content } from '@/components/content'

export const Route = createFileRoute('/manage_/form_/create')({
  component: CreateForm,
  head: () => ({
    meta: [
      {
        title: 'Create Form | OutClimb Management',
      },
    ],
  }),
  beforeLoad: ({ context, location }) =>
    Promise.all([authGuard(context, location), permissionGuard(context, 'form', WRITE_PERMISSION)]),
})

function CreateForm() {
  return (
    <>
      <Header backTo="/manage/form">Create Form</Header>

      <Content></Content>
    </>
  )
}
