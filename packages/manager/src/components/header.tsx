'use client'

import { cn } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { useEffect, useState, type ReactNode } from 'react'

interface HeaderProps {
  actions?: ReactNode
  backTo?: string
}

export function Header({ actions, backTo, children, className, ...props }: React.ComponentProps<'header'> & HeaderProps) {
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
        'bg-white fixed top-0 w-full md:w-(--body-width) p-6 z-10 flex items-center pl-18 md:pl-6 transition-shadow duration-300',
        { 'shadow-md': hovering },
        className,
      )}
      {...props}>
      {backTo && (
        <Link to={backTo} className="mr-3 text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
      )}
      <h2 className="grow font-bold text-2xl">{children}</h2>
      <div>{actions}</div>
    </header>
  )
}
