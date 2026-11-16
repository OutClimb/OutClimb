'use client'

import { createFileRoute, HeadContent, Link } from '@tanstack/react-router'
import { buttonVariants } from '@/components/ui/buttonVariants'

export const Route = createFileRoute('/cancelled')({
  component: CancelledPage,
  head: () => ({
    meta: [{ title: 'Donation cancelled | OutClimb' }],
  }),
})

function CancelledPage() {
  return (
    <>
      <HeadContent />
      <main className="flex min-h-screen flex-col items-center px-4 py-12">
        <img src="/images/logo.svg" alt="OutClimb Queer Climbing" className="mx-auto h-24 w-auto" />
        <h1 className="mt-10 text-center text-3xl font-bold text-slate-700 sm:text-4xl">Donation cancelled</h1>
        <div className="mt-8 w-full max-w-xl rounded-xl bg-gray-100 p-6 text-center shadow-md">
          <p className="text-slate-700">No payment was made. You can try again whenever you're ready.</p>
          <Link to="/" className={`${buttonVariants({ size: 'lg' })} mt-6`}>
            Back to donation form
          </Link>
        </div>
      </main>
    </>
  )
}
