'use client'

import { RouterProvider, createRouter } from '@tanstack/react-router'
import useUserStore from './stores/user'

// Import the generated route tree
import { routeTree } from './routeTree.gen'

// Create a new router instance
const router = createRouter({
  routeTree,
  context: {
    user: undefined!,
  },
})

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

export function App() {
  const user = useUserStore()

  return <RouterProvider router={router} context={{ user }} />
}
