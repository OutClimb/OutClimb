'use client'

import { createRootRoute, Outlet } from '@tanstack/react-router'

const RootLayout = () => {
  return <Outlet />
}

export const Route = createRootRoute({
  component: RootLayout,
  head: () => ({
    meta: [
      {
        title: 'Donate — OutClimb - Queer Climbing',
      },
    ],
  }),
})
