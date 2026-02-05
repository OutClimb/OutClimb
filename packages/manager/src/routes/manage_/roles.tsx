import authGuard from '@/lib/auth-guard'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Content } from '@/components/content'
import { createFileRoute } from '@tanstack/react-router'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Header } from '@/components/header'
import permissionGuard from '@/lib/permission-guard'
import { Plus, Users } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { useCallback, useState } from 'react'
import useRoleStore from '@/stores/role'
import useSelfStore, { READ_PERMISSION, WRITE_PERMISSION } from '@/stores/self'

export const Route = createFileRoute('/manage_/roles')({
  component: Roles,
  head: () => ({
    meta: [
      {
        title: 'Roles | OutClimb Management',
      },
    ],
  }),
  beforeLoad: ({ context, location }) =>
    Promise.all([authGuard(context, location), permissionGuard(context, 'role', READ_PERMISSION)]),
})

function Roles() {
  // const navigate = useNavigate()
  const { hasPermission } = useSelfStore()
  const { isEmpty } = useRoleStore()

  // const [isHydrated, setIsHydrated] = useState<boolean>(false)
  const [isLoading] = useState<boolean>(false)

  const handleCreate = useCallback(() => {}, [])

  // useEffect(() => {
  //   const fetchUsersFromApi = async () => {
  //     setIsLoading(true)

  //     try {
  //       const users = await fetchUsers(token || '')
  //       populate(users)
  //     } catch (error) {
  //       if (error instanceof UnauthorizedError) {
  //         navigate({ to: '/manage/login' })
  //       } else {
  //         // Display error
  //       }
  //     } finally {
  //       setIsHydrated(true)
  //       setIsLoading(false)
  //     }
  //   }

  //   if (!isHydrated) {
  //     fetchUsersFromApi()
  //   }
  // })

  return (
    <>
      <Header
        actions={
          hasPermission('role', WRITE_PERMISSION) && (
            <Button onClick={handleCreate} disabled={isLoading}>
              <Plus />
              Create Role
            </Button>
          )
        }>
        Roles
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
                  <EmptyTitle>Loading roles...</EmptyTitle>
                </EmptyHeader>
              </Empty>
            )}

            {!isLoading && isEmpty() && (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Users />
                  </EmptyMedia>
                  <EmptyTitle>No roles created</EmptyTitle>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>
      </Content>
    </>
  )
}
