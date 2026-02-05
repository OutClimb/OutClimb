import { Content } from '@/components/content'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Spinner } from '@/components/ui/spinner'
import useSelfStore, { WRITE_PERMISSION } from '@/stores/self'
import { createFileRoute } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

export const Route = createFileRoute('/manage/users')({
  component: Users,
})

function Users() {
  const { hasPermission } = useSelfStore()

  const [isHydrated, setIsHydrated] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const handleCreate = useCallback(() => {}, [])

  useEffect(() => {
    const fetchUsersFromApi = async () => {
      setIsLoading(true)

      // try {
      //   const locations = await fetchLocations(token || '')
      //   populate(locations)
      // } catch (error) {
      //   if (error instanceof UnauthorizedError) {
      //     navigate({ to: '/manage/login' })
      //   } else {
      //     // Display error
      //   }
      // } finally {
      setIsHydrated(true)
      setIsLoading(false)
      // }
    }

    if (!isHydrated) {
      fetchUsersFromApi()
    }
  })

  return (
    <>
      <Header
        actions={
          hasPermission('user', WRITE_PERMISSION) && (
            <Button onClick={handleCreate} disabled={isLoading}>
              <Plus />
              Create User
            </Button>
          )
        }>
        Users
      </Header>

      <Content>
        <Card className="p-0">
          <CardContent className="p-0">
            {isLoading && (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Spinner />
                  </EmptyMedia>
                  <EmptyTitle>Loading users...</EmptyTitle>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>
      </Content>
    </>
  )
}
