'use client'

import { createFileRoute, Link } from '@tanstack/react-router'
import { DonateMessageCard } from '@/components/donate-message-card'
import { DonatePageLayout } from '@/components/donate-page-layout'
import { buttonVariants } from '@/components/ui/buttonVariants'

export const Route = createFileRoute('/cancelled')({
  component: CancelledPage,
  head: () => {
    const site = 'OutClimb - Queer Climbing'
    const title = `Donation cancelled — ${site}`
    const excerpt =
      'Help us make climbing accessible. We are a nonprofit working to make climbing accessible to as many trans and queer people as possible.'

    return {
      meta: [
        { title },
        { name: 'description', content: excerpt },
        { property: 'og:site_name', content: site },
        { property: 'og:title', content: title },
        { property: 'og:url', content: 'https://donate.outclimb.gay/cancelled' },
        { property: 'og:type', content: 'website' },
        { property: 'og:description', content: excerpt },
        { property: 'og:image', content: 'https://donate.outclimb.gay/images/hero.jpg' },
        { property: 'og:image:width', content: '648' },
        { property: 'og:image:height', content: '320' },
      ],
    }
  },
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
