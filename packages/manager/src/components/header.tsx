'use client'

import { cn } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'
import { Link, useRouterState } from '@tanstack/react-router'
import { useEffect, useState, type ReactNode } from 'react'

interface HeaderProps {
  actions?: ReactNode
  backTo?: string
  isLoading?: boolean
}

export function Header({
  actions,
  backTo,
  children,
  isLoading = false,
  className,
  ...props
}: React.ComponentProps<'header'> & HeaderProps) {
  const [hovering, setHovering] = useState(false)
  const isRouting = useRouterState({ select: (state) => state.isLoading })
  const showLoading = isLoading || isRouting

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
        'fixed top-0 z-10 flex h-(--header-height) w-full items-center gap-3 border-b border-transparent bg-background/85 px-4 pl-16 backdrop-blur-md transition-colors duration-200 md:w-(--body-width) md:px-10',
        { 'border-border': hovering },
        className,
      )}
      aria-busy={showLoading}
      {...props}>
      {backTo && (
        <Link
          to={backTo}
          aria-label="Back"
          className="-ml-1.5 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <ArrowLeft className="size-5" />
        </Link>
      )}
      <h1 className="min-w-0 grow truncate text-xl font-semibold tracking-tight">{children}</h1>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      <div
        aria-hidden
        className={cn(
          'pride-stripe-loading absolute inset-x-0 -bottom-px h-0.5 transition-opacity duration-300',
          showLoading ? 'opacity-100' : 'opacity-0',
        )}
      />
    </header>
  )
}
