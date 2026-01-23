'use client'

import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/manage/')({
  beforeLoad: async () => {
    if (localStorage.getItem('token') == null) {
      throw redirect({ to: '/manage/login' })
    } else {
      throw redirect({ to: '/manage/redirect' })
    }
  },
})
