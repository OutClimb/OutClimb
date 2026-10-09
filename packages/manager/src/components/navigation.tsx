'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { LogOut, Menu, X } from 'lucide-react'
import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import { NAVIGATION_GROUPS, NAVIGATION_ITEMS } from '@/lib/navigation-items'
import { useState } from 'react'
import useSelfStore, { READ_PERMISSION } from '@/stores/self'

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')

export function Navigation() {
  const location = useLocation()
  const navigate = useNavigate()
  const { hasPermission, logout, user } = useSelfStore()
  const [isOpen, setIsOpen] = useState(false)
  const self = user()
  const displayName = self?.name || self?.username || ''

  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

  const closeSidebar = () => {
    setIsOpen(false)
  }

  const handleLogout = () => {
    logout()
    navigate({
      to: '/manage/login',
    })
  }

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        aria-label="Open menu"
        className={cn('fixed left-4 top-5 z-50 md:hidden', isOpen ? 'hidden' : '')}
        onClick={toggleSidebar}>
        <Menu />
      </Button>

      {/* Sidebar */}
      <div
        className={cn(
          'fixed w-72 max-w-[85dvw] h-dvh inset-y-0 left-0 z-40 shrink-0 grow-0 basis-(--sidebar-width) transform border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-200 ease-in-out md:relative md:w-auto md:max-w-none md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-(--header-height) items-center px-6">
            <div className="grow flex items-center">
              <img src="/manage/images/logo.svg" alt="OutClimb - Queer Climbing" className="h-8" />
            </div>

            <Button variant="ghost" size="icon" aria-label="Close menu" className="md:hidden" onClick={closeSidebar}>
              <X />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
            {NAVIGATION_GROUPS.map((group) => {
              const items = NAVIGATION_ITEMS.filter(
                (item) => item.group === group.id && hasPermission(item.entity, READ_PERMISSION),
              )

              if (items.length === 0) {
                return null
              }

              return (
                <div key={group.id}>
                  <p className="px-3 pb-1.5 text-xs font-medium text-muted-foreground">{group.title}</p>
                  <ul className="space-y-0.5">
                    {items.map((item) => {
                      const isActive = location.pathname.startsWith(item.href)

                      return (
                        <li key={item.href}>
                          <Link
                            to={item.href}
                            onClick={closeSidebar}
                            aria-current={isActive ? 'page' : undefined}
                            className={cn(
                              'relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                              isActive
                                ? 'bg-primary/10 text-primary before:absolute before:inset-y-2 before:-left-3 before:w-1 before:rounded-r-full before:bg-primary'
                                : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                            )}>
                            <item.icon className={cn('size-4', isActive ? 'text-primary' : 'text-muted-foreground')} />
                            {item.title}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )
            })}
          </nav>

          {/* Current user */}
          <div className="border-t border-sidebar-border p-3">
            <div className="flex items-center gap-3 rounded-md px-2 py-1.5">
              <div
                aria-hidden
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                {getInitials(displayName)}
              </div>
              <div className="min-w-0 grow leading-tight">
                <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
                <p className="truncate text-xs text-muted-foreground">{self?.role}</p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Log out"
                title="Log out"
                className="text-muted-foreground"
                onClick={handleLogout}>
                <LogOut />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[1px] md:hidden" onClick={closeSidebar} />
      )}
    </>
  )
}
