'use client'

import { AuthLayout } from '@/components/auth-layout'
import { createFileRoute } from '@tanstack/react-router'
import { LoginForm } from '@/components/login-form'

export const Route = createFileRoute('/manage_/login')({
  component: Login,
  head: () => ({
    meta: [
      {
        title: 'Login | OutClimb Management',
      },
    ],
  }),
})

function Login() {
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  )
}
