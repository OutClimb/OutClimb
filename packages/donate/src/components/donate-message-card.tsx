import type { ReactNode } from 'react'

interface DonateMessageCardProps {
  title: string
  children: ReactNode
}

export function DonateMessageCard({ title, children }: DonateMessageCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm md:p-8">
      <h2 className="text-2xl font-bold text-ink">{title}</h2>
      {children}
    </div>
  )
}
