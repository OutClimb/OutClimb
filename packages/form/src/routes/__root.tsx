'use client'

import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'

const RootLayout = () => {
  return <Outlet />
}

export const Route = createRootRouteWithContext()({
  component: RootLayout,
  head: () => ({
    meta: [
      {
        title: 'OutClimb Registration',
      },
    ],
  }),
})
