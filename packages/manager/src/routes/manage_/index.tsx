'use client'

import { createFileRoute, redirect } from '@tanstack/react-router'
import { NAVIGATION_ITEMS } from '@/lib/navigation-items'
import { READ_PERMISSION } from '@/stores/self'

export const Route = createFileRoute('/manage_/')({
  beforeLoad: async ({ context }) => {
    const { hasPermission, isLoggedIn, logout } = context.user
    if (!isLoggedIn()) {
      throw redirect({ to: '/manage/login' })
    }

    const firstNavItem = NAVIGATION_ITEMS.find((item) => hasPermission(item.entity, READ_PERMISSION))
    if (!firstNavItem) {
      logout()
      throw redirect({ to: '/manage/login' })
    }

    throw redirect({ to: firstNavItem.href })
  },
})
