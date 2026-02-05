'use client'

import { createRootRouteWithContext, HeadContent, Outlet, useLocation } from '@tanstack/react-router'
import { Navigation } from '@/components/navigation'
import type { SelfState } from '@/types/user'

export interface RouterContext {
  user: SelfState
}

const RootLayout = () => {
  const location = useLocation()

  if (location.pathname === '/manage/login' || location.pathname === '/manage/reset') {
    return (
      <>
        <HeadContent />
        <Outlet />
      </>
    )
  }

  return (
    <>
      <HeadContent />
      <div className="h-dvh w-screen md:flex md:flex-row">
        <Navigation />
        <div
          id="scrollContainer"
          className="grow shrink basis-full w-full h-dvh overflow-y-auto md:basis-(--body-width) md:w-(--body-width)">
          <Outlet />
        </div>
      </div>
    </>
  )
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  head: () => ({
    meta: [
      {
        title: 'OutClimb Management',
      },
    ],
  }),
})
