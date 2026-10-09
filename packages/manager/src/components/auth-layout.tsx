'use client'

import { HeadContent } from '@tanstack/react-router'
import type { ReactNode } from 'react'

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <HeadContent />
      <div aria-hidden className="pride-stripe fixed inset-x-0 top-0 h-1" />
      <main className="flex min-h-dvh flex-col items-center justify-center bg-muted/40 p-4">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <img src="/manage/images/logo.svg" alt="OutClimb Queer Climbing" className="mx-auto h-20 w-auto" />
          </div>
          {children}
        </div>
      </main>
    </>
  )
}
