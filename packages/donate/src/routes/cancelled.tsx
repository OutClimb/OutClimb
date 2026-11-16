'use client'

import { createFileRoute, Link } from '@tanstack/react-router'
import { DonateMessageCard } from '@/components/donate-message-card'
import { DonatePageLayout } from '@/components/donate-page-layout'
import { buttonVariants } from '@/components/ui/buttonVariants'

export const Route = createFileRoute('/cancelled')({
  component: CancelledPage,
  head: () => ({
    meta: [{ title: 'Donation cancelled — OutClimb - Queer Climbing<' }],
  }),
})

function CancelledPage() {
  return (
    <DonatePageLayout>
      <DonateMessageCard title="Donation cancelled">
        <p className="leading-relaxed text-ink-soft">No payment was made. You can try again whenever you're ready.</p>
        <Link to="/" className={`${buttonVariants()} h-[52px] w-full rounded-[10px] text-base shadow-xs`}>
          Back to donation form
        </Link>
      </DonateMessageCard>
    </DonatePageLayout>
  )
}
