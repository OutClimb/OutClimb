'use client'

import { createFileRoute, HeadContent } from '@tanstack/react-router'
import { LoginForm } from '@/components/login-form'

export const Route = createFileRoute('/manage/login')({
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
    <>
      <HeadContent />
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <img src="/manage/images/logo.svg" alt="OutClimb Queer Climbing" className="h-24 w-auto mx-auto" />
          </div>
          <LoginForm />
        </div>
      </main>
    </>
  )
}
