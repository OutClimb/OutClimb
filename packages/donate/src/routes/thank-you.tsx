'use client'

import { createFileRoute, HeadContent } from '@tanstack/react-router'

export const Route = createFileRoute('/thank-you')({
  component: ThankYouPage,
  head: () => ({
    meta: [{ title: 'Thank you | OutClimb' }],
  }),
})

function ThankYouPage() {
  return (
    <>
      <HeadContent />
      <main className="flex min-h-screen flex-col items-center px-4 py-12">
        <img src="/images/logo.svg" alt="OutClimb Queer Climbing" className="mx-auto h-24 w-auto" />
        <h1 className="mt-10 text-center text-3xl font-bold text-slate-700 sm:text-4xl">Thank you!</h1>
        <div className="mt-8 w-full max-w-xl rounded-xl bg-gray-100 p-6 text-center shadow-md">
          <p className="text-slate-700">
            Your donation helps OutClimb create welcoming climbing spaces for the queer and trans community.
          </p>
          <p className="mt-4 text-slate-700">A receipt will be sent to the email you provided at checkout.</p>
        </div>
      </main>
    </>
  )
}
