'use client'

import authGuard from '@/lib/auth-guard'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Content } from '@/components/content'
import { DeleteDialog } from '@/components/delete-dialog'
import { RedirectEditorDialog } from '@/components/redirect/redirect-editor-dialog'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { fetchRedirects, removeRedirect } from '@/api/redirect'
import { Header } from '@/components/header'
import permissionGuard from '@/lib/permission-guard'
import { Plus, Waypoints } from 'lucide-react'
import { RedirectsTable } from '@/components/redirect/redirects-table'
import { Spinner } from '@/components/ui/spinner'
import { UnauthorizedError } from '@/errors/unauthorized'
import { useCrudDialogs } from '@/lib/use-crud-dialogs'
import { useEffect, useState } from 'react'
import useRedirectStore from '@/stores/redirect'
import useSelfStore, { READ_PERMISSION, WRITE_PERMISSION } from '@/stores/self'

export const Route = createFileRoute('/manage_/redirect')({
  component: Redirects,
  head: () => ({
    meta: [
      {
        title: 'Redirects | OutClimb Management',
      },
    ],
  }),
  beforeLoad: ({ context, location }) =>
    Promise.all([authGuard(context, location), permissionGuard(context, 'redirect', READ_PERMISSION)]),
})

function Redirects() {
  const navigate = useNavigate()
  const { hasPermission, token } = useSelfStore()
  const { data, isEmpty, list, populate, remove } = useRedirectStore()

  const [isHydrated, setIsHydrated] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const {
    selectedId,
    isEditorOpen,
    handleEditorOpenChange,
    isDeleteDialogOpen,
    handleCreate,
    handleEdit,
    handleDelete,
    handleDeleteDialogOpenChange,
  } = useCrudDialogs()

  useEffect(() => {
    const fetchRedirectsFromApi = async () => {
      setIsLoading(true)

      try {
        const redirects = await fetchRedirects(token || '')
        populate(redirects)
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
      fetchRedirectsFromApi()
    }
  })

  return (
    <>
      <Header
        actions={
          hasPermission('redirect', WRITE_PERMISSION) && (
            <Button onClick={handleCreate} disabled={isLoading}>
              <Plus />
              Create Redirect
            </Button>
          )
        }>
        Redirects
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
                  <EmptyTitle>Loading redirects...</EmptyTitle>
                </EmptyHeader>
              </Empty>
            )}

            {!isLoading && isEmpty() && (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Waypoints />
                  </EmptyMedia>
                  <EmptyTitle>No redirects configured</EmptyTitle>
                </EmptyHeader>
              </Empty>
            )}

            {!isLoading && !isEmpty() && (
              <RedirectsTable
                data={list()}
                canEdit={hasPermission('redirect', WRITE_PERMISSION)}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}
          </CardContent>
        </Card>
      </Content>

      {hasPermission('redirect', WRITE_PERMISSION) && (
        <>
          <RedirectEditorDialog
            open={isEditorOpen}
            onOpenChange={handleEditorOpenChange}
            initialRedirect={selectedId != null ? data[selectedId] : undefined}
          />
          <DeleteDialog
            id={selectedId}
            open={isDeleteDialogOpen}
            onOpenChange={handleDeleteDialogOpenChange}
            label="redirect"
            deleteFn={removeRedirect}
            removeFromStore={remove}
          />
        </>
      )}
    </>
  )
}
