'use client'

import authGuard from '@/lib/auth-guard'
import { createFileRoute, HeadContent } from '@tanstack/react-router'
import { ResetForm } from '@/components/reset-form'

export const Route = createFileRoute('/manage/reset')({
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
    <>
      <HeadContent />
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <img src="/manage/images/logo.svg" alt="OutClimb Queer Climbing" className="h-24 w-auto mx-auto" />
          </div>
          <ResetForm />
        </div>
      </main>
    </>
  )
}
