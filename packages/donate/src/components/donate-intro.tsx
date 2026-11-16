import { FileText, ShieldCheck } from 'lucide-react'
import type { ReactNode } from 'react'
import { CONTACT_EMAIL, EIN, FINANCIAL_REPORT_URL } from '@/lib/site-links'

interface InfoCardProps {
  icon: ReactNode
  title: string
  description: string
  linkLabel: string
  linkHref: string
}

function InfoCard({ icon, title, description, linkLabel, linkHref }: InfoCardProps) {
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-white p-5 shadow-xs">
      <span className="text-brand">{icon}</span>
      <strong className="font-semibold text-ink">{title}</strong>
      <span className="text-sm leading-relaxed text-ink-soft">{description}</span>
      <a href={linkHref} className="text-sm font-medium text-brand hover:underline">
        {linkLabel}
      </a>
    </div>
  )
}

export function DonateHero() {
  return (
    <div className="flex flex-col gap-3.5">
      <span className="text-sm font-semibold tracking-widest text-brand uppercase">Donate</span>
      <h1 className="text-[1.875rem] leading-[1.15] font-extrabold tracking-tight text-ink md:text-5xl lg:text-[3.2rem]">
        Help us make climbing accessible.
      </h1>
      <p className="max-w-[540px] text-lg leading-relaxed text-ink-soft">
        OutClimb is a 501(c)(3) nonprofit working to make climbing accessible to as many trans and queer people as
        possible. Every dollar goes toward getting more of our community on the wall.
      </p>
    </div>
  )
}

export function DonateInfo() {
  return (
    <div className="flex flex-col gap-6">
      <img
        src="/images/hero.jpg"
        srcSet="/images/hero.jpg 1x, /images/hero@2x.jpg 2x"
        alt="A climber in a helmet and harness reaching up a rock face above clear lake water"
        className="h-[200px] w-full rounded-xl object-cover object-[75%_center] md:h-80"
      />
      <div className="grid gap-4 md:grid-cols-2">
        <InfoCard
          icon={<FileText aria-hidden="true" className="size-[22px]" />}
          title="See where it goes"
          description="We publish our finances every year."
          linkLabel="2025 Financial Report →"
          linkHref={FINANCIAL_REPORT_URL}
        />
        <InfoCard
          icon={<ShieldCheck aria-hidden="true" className="size-[22px]" />}
          title="Tax deductible"
          description={`All donations are tax deductible. EIN ${EIN}.`}
          linkLabel="Questions? Email us →"
          linkHref={`mailto:${CONTACT_EMAIL}`}
        />
      </div>
    </div>
  )
}
