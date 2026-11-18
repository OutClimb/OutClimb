'use client'

import { createFileRoute } from '@tanstack/react-router'
import { DonateMessageCard } from '@/components/donate-message-card'
import { DonatePageLayout } from '@/components/donate-page-layout'

export const Route = createFileRoute('/thank-you')({
  component: ThankYouPage,
  head: () => {
    const site = 'OutClimb - Queer Climbing'
    const title = `Thank you — ${site}`
    const excerpt =
      'Help us make climbing accessible. We are a nonprofit working to make climbing accessible to as many trans and queer people as possible.'

    return {
      meta: [
        { title },
        { name: 'description', content: excerpt },
        { property: 'og:site_name', content: site },
        { property: 'og:title', content: title },
        { property: 'og:url', content: 'https://donate.outclimb.gay/thank-you' },
        { property: 'og:type', content: 'website' },
        { property: 'og:description', content: excerpt },
        { property: 'og:image', content: 'https://donate.outclimb.gay/images/hero.jpg' },
        { property: 'og:image:width', content: '648' },
        { property: 'og:image:height', content: '320' },
      ],
    }
  },
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
