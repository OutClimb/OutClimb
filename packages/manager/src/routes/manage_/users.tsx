import authGuard from '@/lib/auth-guard'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Content } from '@/components/content'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { fetchUsers } from '@/api/user'
import { Header } from '@/components/header'
import permissionGuard from '@/lib/permission-guard'
import { Plus, User } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { useCallback, useEffect, useState } from 'react'
import { UsersTable } from '@/components/users/users-table'
import useSelfStore, { READ_PERMISSION, WRITE_PERMISSION } from '@/stores/self'
import useUserStore from '@/stores/user'
import { UnauthorizedError } from '@/errors/unauthorized'

export const Route = createFileRoute('/manage_/users')({
  component: Users,
  head: () => ({
    meta: [
      {
        title: 'Users | OutClimb Management',
      },
    ],
  }),
  beforeLoad: ({ context, location }) =>
    Promise.all([authGuard(context, location), permissionGuard(context, 'user', READ_PERMISSION)]),
})

function Users() {
  const navigate = useNavigate()
  const { hasPermission, token } = useSelfStore()
  const { isEmpty, list, populate } = useUserStore()

  const [isHydrated, setIsHydrated] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const handleCreate = useCallback(() => {}, [])

  useEffect(() => {
    const fetchUsersFromApi = async () => {
      setIsLoading(true)

      try {
        const users = await fetchUsers(token || '')
        populate(users)
      } catch (error) {
        if (error instanceof UnauthorizedError) {
          navigate({ to: '/manage/login' })
        } else {
          // Display error
        }
      } finally {
        setIsHydrated(true)
        setIsLoading(false)
      }
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

            {!isLoading && isEmpty() && (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <User />
                  </EmptyMedia>
                  <EmptyTitle>No users created</EmptyTitle>
                </EmptyHeader>
              </Empty>
            )}

            {!isLoading && !isEmpty() && (
              <UsersTable
                data={list()}
                canEdit={hasPermission('user', WRITE_PERMISSION)}
                onEdit={() => {}}
                onDelete={() => {}}
              />
            )}
          </CardContent>
        </Card>
      </Content>
    </>
  )
}
