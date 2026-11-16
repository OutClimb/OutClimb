'use client'

import { createFileRoute } from '@tanstack/react-router'
import { DonateMessageCard } from '@/components/donate-message-card'
import { DonatePageLayout } from '@/components/donate-page-layout'

export const Route = createFileRoute('/thank-you')({
  component: ThankYouPage,
  head: () => ({
    meta: [{ title: 'Thank you — OutClimb - Queer Climbing<' }],
  }),
})

function ThankYouPage() {
  return (
    <DonatePageLayout>
      <DonateMessageCard title="Thank you!">
        <p className="leading-relaxed text-ink-soft">
          Your donation helps OutClimb create welcoming climbing spaces for the queer and trans community.
        </p>
        <p className="leading-relaxed text-ink-soft">A receipt will be sent to the email you provided at checkout.</p>
      </DonateMessageCard>
    </DonatePageLayout>
  )
}
