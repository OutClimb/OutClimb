'use client'

import { createFileRoute } from '@tanstack/react-router'
import { DonatePageLayout } from '@/components/donate-page-layout'
import { DonationForm } from '@/components/donation-form'
import { buildPageMeta, DONATE_PAGES } from '@/lib/page-meta'

export const Route = createFileRoute('/')({
  component: DonatePage,
  head: () => ({ meta: buildPageMeta(DONATE_PAGES.donate) }),
})

function DonatePage() {
  return (
    <DonatePageLayout>
      <DonationForm />
    </DonatePageLayout>
  )
}
