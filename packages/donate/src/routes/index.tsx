'use client'

import { createFileRoute } from '@tanstack/react-router'
import { DonatePageLayout } from '@/components/donate-page-layout'
import { DonationForm } from '@/components/donation-form'

export const Route = createFileRoute('/')({
  component: DonatePage,
})

function DonatePage() {
  return (
    <DonatePageLayout>
      <DonationForm />
    </DonatePageLayout>
  )
}
