import { redirect, type ParsedLocation } from '@tanstack/react-router'
import type { RouterContext } from '@/routes/__root'

export default async (context: RouterContext, location: ParsedLocation) => {
  if (!context.user.isLoggedIn()) {
    throw redirect({
      to: '/manage/login',
      search: {
        redirect: location.href,
      },
    })
  }
}
