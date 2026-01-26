'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { FileText, Image, LogOut, MapPin, Menu, Upload, Waypoints, X } from 'lucide-react'
import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import useUserStore from '@/stores/user'

export function Navigation() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useUserStore()
  const [isOpen, setIsOpen] = useState(false)

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

  const navItems = [
    {
      title: 'Assets',
      href: '/manage/asset',
      icon: Upload,
    },
    {
      title: 'Forms',
      href: '/manage/form',
      icon: FileText,
    },
    {
      title: 'Event Locations',
      href: '/manage/location',
      icon: MapPin,
    },
    {
      title: 'Redirects',
      href: '/manage/redirect',
      icon: Waypoints,
    },
    {
      title: 'Social Images',
      href: '/manage/social',
      icon: Image,
    },
  ]

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className={cn('absolute left-6 top-6 z-50 md:hidden', isOpen ? 'hidden' : '')}
        onClick={toggleSidebar}>
        <Menu />
      </Button>

      {/* Sidebar */}
      <div
        className={cn(
          'absolute w-dvw h-dvh inset-y-0 left-0 z-40 shrink-0 grow-0 basis-(--sidebar-width) transform bg-sidebar transition-transform duration-200 ease-in-out md:relative md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center border-b px-6">
            <div className="grow flex items-center gap-2">
              <div className="h-8">
                <img src="/manage/images/logo.svg" alt="OutClimb - Queer Climbing" className="h-8" />
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className={cn('md:hidden', isOpen ? '' : 'hidden')}
              onClick={toggleSidebar}>
              <X />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={closeSidebar}
                className={cn(
                  'flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  location.pathname.startsWith(item.href)
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                )}>
                <item.icon className="mr-3 h-5 w-5" />
                {item.title}
              </Link>
            ))}
          </nav>

          <div className="mt-auto border-t px-3 py-4">
            <button
              onClick={handleLogout}
              className="flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors w-full hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={toggleSidebar} />}
    </>
  )
}
