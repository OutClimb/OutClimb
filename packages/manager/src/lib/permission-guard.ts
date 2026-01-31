import { redirect } from '@tanstack/react-router'
import type { RouterContext } from '@/routes/__root'

export default async (context: RouterContext, entity: string, level: number) => {
  if (!context.user.hasPermission(entity, level)) {
    context.user.logout()
    throw redirect({
      to: '/manage/login',
    })
  }
}
