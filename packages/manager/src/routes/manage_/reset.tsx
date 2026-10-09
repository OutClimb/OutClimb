'use client'

import authGuard from '@/lib/auth-guard'
import { AuthLayout } from '@/components/auth-layout'
import { createFileRoute } from '@tanstack/react-router'
import { ResetForm } from '@/components/reset-form'

export const Route = createFileRoute('/manage_/reset')({
  component: Reset,
  head: () => ({
    meta: [
      {
        title: 'Reset Password | OutClimb Management',
      },
    ],
  }),
  beforeLoad: ({ context, location }) => authGuard(context, location),
})

function Reset() {
  return (
    <AuthLayout>
      <ResetForm />
    </AuthLayout>
  )
}
