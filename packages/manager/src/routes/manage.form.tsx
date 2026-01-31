'use client'

import authGuard from '@/lib/auth-guard'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { createFileRoute } from '@tanstack/react-router'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Header } from '@/components/header'
import permissionGuard from '@/lib/permission-guard'
import { Plus } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { useState } from 'react'
import useUserStore, { READ_PERMISSION, WRITE_PERMISSION } from '@/stores/user'

export const Route = createFileRoute('/manage/form')({
  component: RouteComponent,
  head: () => ({
    meta: [
      {
        title: 'Forms | OutClimb Management',
      },
    ],
  }),
  beforeLoad: ({ context, location }) =>
    Promise.all([authGuard(context, location), permissionGuard(context, 'form', READ_PERMISSION)]),
})

function RouteComponent() {
  const { hasPermission } = useUserStore()
  const [isLoading] = useState<boolean>(true)

  return (
    <>
      <Header
        actions={
          hasPermission('form', WRITE_PERMISSION) && (
            <Button disabled={isLoading}>
              <Plus />
              Create Form
            </Button>
          )
        }>
        Forms
      </Header>

      <Card className="p-0">
        <CardContent className="p-0">
          {isLoading && (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Spinner />
                </EmptyMedia>
                <EmptyTitle>Loading forms...</EmptyTitle>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>
    </>
  )
}
