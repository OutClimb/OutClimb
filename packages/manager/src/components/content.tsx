'use client'

import { cn } from '@/lib/utils'

export function Content({ children, className, ...props }: React.ComponentProps<'main'>) {
  return (
    <main className={cn('mt-(--header-height) px-4 pt-2 pb-10 md:px-10', className)} {...props}>
      {children}
    </main>
  )
}
