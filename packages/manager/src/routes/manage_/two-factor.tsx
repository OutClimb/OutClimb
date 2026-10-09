'use client'

import authGuard from '@/lib/auth-guard'
import { AuthLayout } from '@/components/auth-layout'
import { createFileRoute } from '@tanstack/react-router'
import { TwoFactorSetupForm } from '@/components/two-factor-setup-form'

export const Route = createFileRoute('/manage_/two-factor')({
  component: TwoFactor,
  head: () => ({
    meta: [
      {
        title: 'Two-Factor Setup | OutClimb Management',
      },
    ],
  }),
  beforeLoad: ({ context, location }) => authGuard(context, location),
})

function TwoFactor() {
  return (
    <AuthLayout>
      <TwoFactorSetupForm />
    </AuthLayout>
  )
}
