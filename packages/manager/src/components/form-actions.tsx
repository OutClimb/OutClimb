'use client'

import { cn } from '@/lib/utils'

export function FormActions({ children, className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'sticky bottom-0 z-10 -mx-4 -mb-10 mt-6 flex items-center justify-end gap-2 border-t bg-background/85 px-4 py-3 backdrop-blur-md md:-mx-10 md:px-10',
        className,
      )}
      {...props}>
      {children}
    </div>
  )
}
