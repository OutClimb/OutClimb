'use client'

import { useState, type ReactNode } from 'react'
import { createFileRoute, HeadContent, type ErrorComponentProps } from '@tanstack/react-router'
import { fetchForm } from '@/api/form'
import { RegistrationForm } from '@/components/registration-form'
import { NotFoundError } from '@/errors/not-found'
import type { Form } from '@/types/form'

export const Route = createFileRoute('/form_/$slug')({
  loader: ({ params }) => fetchForm(params.slug),
  component: FormPage,
  pendingComponent: FormPending,
  errorComponent: FormErrorPage,
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData ? `${loaderData.name} | OutClimb` : 'OutClimb Registration',
      },
    ],
  }),
})

function formatDate(ms: number): string {
  // The backend always operates in Central Time, so show times in it regardless of the visitor's timezone.
  return new Date(ms).toLocaleString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Chicago',
    timeZoneName: 'short',
  })
}

function statusMessage(form: Form): string | null {
  switch (form.status) {
    case 'notOpen':
      return (
        form.notOpenMessage ||
        (form.opensOn ? `Registration opens on ${formatDate(form.opensOn)}.` : 'Registration is not open yet.')
      )
    case 'closed':
      return form.closedMessage || 'Registration for this event has closed.'
    case 'filled':
      return form.filledMessage || 'This event is full. Thank you for your interest!'
    default:
      return null
  }
}

function Layout({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <>
      <HeadContent />
      <main className="flex min-h-screen flex-col items-center px-4 py-12">
        <img src="/form/images/logo.svg" alt="OutClimb Queer Climbing" className="mx-auto h-24 w-auto" />
        {title && <h1 className="mt-10 text-center text-3xl font-bold text-slate-700 sm:text-4xl">{title}</h1>}
        <div className="mt-8 w-full max-w-xl rounded-xl bg-gray-100 p-6 shadow-md">{children}</div>
      </main>
    </>
  )
}

function Message({ children }: { children: ReactNode }) {
  return <p className="text-center text-base whitespace-pre-line">{children}</p>
}

function FormPage() {
  const form = Route.useLoaderData()
  const [submitted, setSubmitted] = useState(false)
  const message = statusMessage(form)

  return (
    <Layout title={form.name}>
      {submitted ? (
        <Message>{form.successMessage || 'Thank you! Your registration has been received.'}</Message>
      ) : message ? (
        <Message>{message}</Message>
      ) : (
        <RegistrationForm form={form} onSuccess={() => setSubmitted(true)} />
      )}
    </Layout>
  )
}

function FormPending() {
  return (
    <Layout>
      <Message>Loading…</Message>
    </Layout>
  )
}

function FormErrorPage({ error }: ErrorComponentProps) {
  return (
    <Layout>
      <Message>
        {error instanceof NotFoundError
          ? "We couldn't find this form. Please check the link and try again."
          : (error instanceof Error && error.message) || 'An error occurred. Please try again.'}
      </Message>
    </Layout>
  )
}
