import authGuard from '@/lib/auth-guard'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Content } from '@/components/content'
import { CreateRoleDialog } from '@/components/roles/create-role-dialog'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { DeleteDialog } from '@/components/delete-dialog'
import { EditRoleDialog } from '@/components/roles/edit-role-dialog'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { fetchRoles, removeRole } from '@/api/role'
import { Header } from '@/components/header'
import permissionGuard from '@/lib/permission-guard'
import { Plus, Users } from 'lucide-react'
import { RolesTable } from '@/components/roles/roles-table'
import { Spinner } from '@/components/ui/spinner'
import { useCrudDialogs } from '@/lib/use-crud-dialogs'
import { useEffect, useState } from 'react'
import useRoleStore from '@/stores/role'
import useSelfStore, { READ_PERMISSION, WRITE_PERMISSION } from '@/stores/self'
import { UnauthorizedError } from '@/errors/unauthorized'

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
  const navigate = useNavigate()
  const { hasPermission, token } = useSelfStore()
  const { isEmpty, list, populate, remove } = useRoleStore()

  const [isHydrated, setIsHydrated] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const { selectedId, isCreateDialogOpen, setIsCreateDialogOpen, isEditDialogOpen, isDeleteDialogOpen, handleCreate, handleEdit, handleEditDialogOpenChange, handleDelete, handleDeleteDialogOpenChange } = useCrudDialogs()

  useEffect(() => {
    const fetchFromApi = async () => {
      setIsLoading(true)

      try {
        const roles = await fetchRoles(token || '')
        populate(roles)
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
      fetchFromApi()
    }
  })

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

            {!isLoading && !isEmpty() && (
              <RolesTable
                data={list()}
                canEdit={hasPermission('role', WRITE_PERMISSION)}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}
          </CardContent>
        </Card>
      </Content>

      {hasPermission('role', WRITE_PERMISSION) && (
        <>
          <CreateRoleDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />
          <EditRoleDialog id={selectedId} open={isEditDialogOpen} onOpenChange={handleEditDialogOpenChange} />
          <DeleteDialog id={selectedId} open={isDeleteDialogOpen} onOpenChange={handleDeleteDialogOpenChange} label="role" deleteFn={removeRole} removeFromStore={remove} />
        </>
      )}
    </>
  )
}
