import authGuard from '@/lib/auth-guard'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { createFileRoute } from '@tanstack/react-router'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Header } from '@/components/header'
import { Spinner } from '@/components/ui/spinner'
import { Upload } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/manage/asset')({
  component: Assets,
  head: () => ({
    meta: [
      {
        title: 'Assets | OutClimb Management',
      },
    ],
  }),
  beforeLoad: ({ context, location }) => authGuard(context, location),
})

function Assets() {
  const [isLoading] = useState<boolean>(true)

  return (
    <>
      <Header
        actions={
          <Button disabled={isLoading}>
            <Upload />
            Upload Asset
          </Button>
        }>
        Assets
      </Header>

      <Card className="p-0">
        <CardContent className="p-0">
          {isLoading && (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Spinner />
                </EmptyMedia>
                <EmptyTitle>Loading assets...</EmptyTitle>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>
    </>
  )
}
