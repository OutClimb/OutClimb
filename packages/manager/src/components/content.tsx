'use client'

import { cn } from '@/lib/utils'

export function Content({ children, className, ...props }: React.ComponentProps<'main'>) {
  return (
    <main className={cn('mt-16 p-6 md:p-10 md:mt-12', className)} {...props}>
      {children}
    </main>
  )
}
