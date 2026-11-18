'use client'

import { createFileRoute } from '@tanstack/react-router'
import { DonatePageLayout } from '@/components/donate-page-layout'
import { DonationForm } from '@/components/donation-form'

export const Route = createFileRoute('/')({
  component: DonatePage,
  head: () => {
    const site = 'OutClimb - Queer Climbing'
    const title = `Donate — ${site}`
    const excerpt =
      'Help us make climbing accessible. We are a nonprofit working to make climbing accessible to as many trans and queer people as possible.'

    return {
      meta: [
        { title },
        { name: 'description', content: excerpt },
        { property: 'og:site_name', content: site },
        { property: 'og:title', content: title },
        { property: 'og:url', content: 'https://donate.outclimb.gay' },
        { property: 'og:type', content: 'website' },
        { property: 'og:description', content: excerpt },
        { property: 'og:image', content: 'https://donate.outclimb.gay/images/hero.jpg' },
        { property: 'og:image:width', content: '648' },
        { property: 'og:image:height', content: '320' },
      ],
    }
  },
})

function DonatePage() {
  return (
    <DonatePageLayout>
      <DonationForm />
    </DonatePageLayout>
  )
}
