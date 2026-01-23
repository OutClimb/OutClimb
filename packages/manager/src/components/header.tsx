'use client'

import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface HeaderProps {
  actions?: ReactNode
}

export function Header({ actions, children, className, ...props }: React.ComponentProps<'header'> & HeaderProps) {
  return (
    <header className={cn('flex items-center mb-6 ml-12 md:ml-0', className)} {...props}>
      <h2 className="grow font-bold text-2xl">{children}</h2>
      <div>{actions}</div>
    </header>
  )
}
