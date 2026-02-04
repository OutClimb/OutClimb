'use client'

import { cn } from '@/lib/utils'
import { useEffect, useState, type ReactNode } from 'react'

interface HeaderProps {
  actions?: ReactNode
}

export function Header({ actions, children, className, ...props }: React.ComponentProps<'header'> & HeaderProps) {
  const [hovering, setHovering] = useState(false)

  useEffect(() => {
    const scrollContainer = document.getElementById('scrollContainer')

    const handleScroll = () => {
      setHovering((prev) => {
        const scrollTop = scrollContainer?.scrollTop || 0

        if (scrollTop > 0 && !prev) {
          return true
        } else if (scrollTop === 0 && prev) {
          return false
        }

        return prev
      })
    }

    scrollContainer?.addEventListener('scroll', handleScroll)

    return () => {
      scrollContainer?.removeEventListener('scroll', handleScroll)
    }
  }, [setHovering])

  return (
    <header
      className={cn(
        'bg-white fixed top-0 w-(--body-width) p-6 z-10 flex items-center ml-12 md:ml-0 transition-shadow duration-300',
        { 'shadow-md': hovering },
        className,
      )}
      {...props}>
      <h2 className="grow font-bold text-2xl">{children}</h2>
      <div>{actions}</div>
    </header>
  )
}
