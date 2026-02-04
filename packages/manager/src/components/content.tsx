'use client'

import { cn } from '@/lib/utils'

export function Content({ children, className, ...props }: React.ComponentProps<'main'>) {
  return (
    <main className={cn('mt-12 p-6 md:p-10 ', className)} {...props}>
      {children}
    </main>
  )
}
