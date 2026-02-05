'use client'

import { createFileRoute, redirect } from '@tanstack/react-router'
import { NAVIGATION_ITEMS } from '@/lib/navigation-items'
import { READ_PERMISSION } from '@/stores/self'

export const Route = createFileRoute('/manage/')({
  beforeLoad: async ({ context }) => {
    const { hasPermission } = context.user
    if (localStorage.getItem('token') == null) {
      throw redirect({ to: '/manage/login' })
    }

    const firstNavItem = NAVIGATION_ITEMS.find((item) => hasPermission(item.entity, READ_PERMISSION))
    if (!firstNavItem) {
      context.user.logout()
      throw redirect({ to: '/manage/login' })
    }

    throw redirect({ to: firstNavItem.href })
  },
})
