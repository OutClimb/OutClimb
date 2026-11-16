import type { ReactNode } from 'react'
import { HeadContent } from '@tanstack/react-router'
import { DonateHero, DonateInfo } from '@/components/donate-intro'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'

interface DonatePageLayoutProps {
  children: ReactNode
}

export function DonatePageLayout({ children }: DonatePageLayoutProps) {
  return (
    <>
      <HeadContent />
      <div className="flex min-h-screen flex-col bg-page text-ink">
        <SiteHeader />
        <main className="mx-auto grid w-full max-w-[680px] flex-1 items-start gap-7 px-4 pt-7 pb-14 md:px-6 md:pt-14 md:pb-22 lg:max-w-[1240px] lg:grid-cols-2 lg:gap-x-12 lg:gap-y-8">
          <DonateHero />
          <div className="lg:col-start-1 lg:row-start-2">
            <DonateInfo />
          </div>
          <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">{children}</div>
        </main>
        <SiteFooter />
      </div>
    </>
  )
}
