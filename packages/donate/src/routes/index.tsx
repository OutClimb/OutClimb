'use client'

import { createFileRoute, HeadContent } from '@tanstack/react-router'
import { DonationForm } from '@/components/donation-form'

export const Route = createFileRoute('/')({
  component: DonatePage,
})

function DonatePage() {
  return (
    <>
      <HeadContent />
      <main className="flex min-h-screen flex-col items-center px-4 py-12">
        <img src="/images/logo.svg" alt="OutClimb Queer Climbing" className="mx-auto h-24 w-auto" />
        <h1 className="mt-10 text-center text-3xl font-bold text-slate-700 sm:text-4xl">Donate to OutClimb</h1>
        <div className="mt-8 w-full max-w-xl rounded-xl bg-gray-100 p-6 shadow-md">
          <DonationForm />
        </div>
      </main>
    </>
  )
}
