'use client'

import authGuard from '@/lib/auth-guard'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { CreateRedirectDialog } from '@/components/create-redirect-dialog'
import { DeleteRedirectDialog } from '@/components/delete-redirect-dialog'
import { EditRedirectDialog } from '@/components/edit-redirect-dialog'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { fetchRedirects } from '@/api/redirect'
import { Header } from '@/components/header'
import { Plus, Waypoints } from 'lucide-react'
import { RedirectsTable } from '@/components/redirects-table'
import { Spinner } from '@/components/ui/spinner'
import { UnauthorizedError } from '@/errors/unauthorized'
import { useCallback, useEffect, useState } from 'react'
import useRedirectStore from '@/stores/redirect'
import useUserStore from '@/stores/user'

export const Route = createFileRoute('/manage/redirect')({
  component: Redirects,
  head: () => ({
    meta: [
      {
        title: 'Redirects | OutClimb Management',
      },
    ],
  }),
  beforeLoad: ({ context, location }) => authGuard(context, location),
})

function Redirects() {
  const navigate = useNavigate()
  const { token } = useUserStore()
  const { isEmpty, list, populate } = useRedirectStore()

  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState<boolean>(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false)

  const handleCreate = useCallback(() => {
    setIsCreateDialogOpen(true)
  }, [setIsCreateDialogOpen])

  const handleEdit = useCallback(
    (id: number) => {
      setSelectedId(id)
      setIsEditDialogOpen(true)
    },
    [setSelectedId],
  )

  const handleEditDialogOpenChange = useCallback(() => {
    setSelectedId(null)
    setIsEditDialogOpen(false)
  }, [])

  const handleDelete = useCallback(
    (id: number) => {
      setSelectedId(id)
      setIsDeleteDialogOpen(true)
    },
    [setSelectedId, setIsDeleteDialogOpen],
  )

  const handleDeleteDialogOpenChange = useCallback(() => {
    setSelectedId(null)
    setIsDeleteDialogOpen(false)
  }, [setSelectedId, setIsDeleteDialogOpen])

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
        setIsLoading(false)
      }
    }

    if (isEmpty()) {
      fetchRedirectsFromApi()
    }
  })

  return (
    <>
      <Header
        actions={
          <Button onClick={handleCreate} disabled={isLoading}>
            <Plus />
            Create Redirect
          </Button>
        }>
        Redirects
      </Header>

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

          {!isLoading && !isEmpty() && <RedirectsTable data={list()} onEdit={handleEdit} onDelete={handleDelete} />}
        </CardContent>
      </Card>

      <CreateRedirectDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />
      <EditRedirectDialog id={selectedId} open={isEditDialogOpen} onOpenChange={handleEditDialogOpenChange} />
      <DeleteRedirectDialog id={selectedId} open={isDeleteDialogOpen} onOpenChange={handleDeleteDialogOpenChange} />
    </>
  )
}
