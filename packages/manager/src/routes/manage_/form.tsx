'use client'

import authGuard from '@/lib/auth-guard'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { fetchForms } from '@/api/form'
import { FormsTable } from '@/components/form/forms-table'
import { Header } from '@/components/header'
import { NotebookPen, Plus } from 'lucide-react'
import permissionGuard from '@/lib/permission-guard'
import { Spinner } from '@/components/ui/spinner'
import { UnauthorizedError } from '@/errors/unauthorized'
import { useCallback, useEffect, useState } from 'react'
import useFormStore from '@/stores/form'
import useSelfStore, { READ_PERMISSION, WRITE_PERMISSION } from '@/stores/self'
import { Content } from '@/components/content'

export const Route = createFileRoute('/manage_/form')({
  component: Forms,
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

function Forms() {
  const navigate = useNavigate()
  const { hasPermission, token } = useSelfStore()
  const { isEmpty, list, populate } = useFormStore()

  const [isHydrated, setIsHydrated] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [_selectedId, setSelectedId] = useState<number | null>(null)
  const [_isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false)

  const handleDelete = useCallback(
    (id: number) => {
      setSelectedId(id)
      setIsDeleteDialogOpen(true)
    },
    [setSelectedId, setIsDeleteDialogOpen],
  )

  useEffect(() => {
    const fetchFormsFromApi = async () => {
      setIsLoading(true)

      try {
        const forms = await fetchForms(token || '')
        populate(forms)
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
      fetchFormsFromApi()
    }
  })

  return (
    <>
      <Header
        actions={
          hasPermission('form', WRITE_PERMISSION) && (
            <Link to="/manage/form/create">
              <Button disabled={isLoading}>
                <Plus />
                Create Form
              </Button>
            </Link>
          )
        }>
        Forms
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
                  <EmptyTitle>Loading forms...</EmptyTitle>
                </EmptyHeader>
              </Empty>
            )}

            {!isLoading && isEmpty() && (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <NotebookPen />
                  </EmptyMedia>
                  <EmptyTitle>No forms added</EmptyTitle>
                </EmptyHeader>
              </Empty>
            )}

            {!isLoading && !isEmpty() && (
              <FormsTable
                data={list()}
                canEdit={hasPermission('form', WRITE_PERMISSION)}
                onDelete={handleDelete}
              />
            )}
          </CardContent>
        </Card>
      </Content>

      {hasPermission('form', WRITE_PERMISSION) && (
        <>
          {/* <CreateFormDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} /> */}
          {/* <EditFormDialog id={selectedId} open={isEditDialogOpen} onOpenChange={handleEditDialogOpenChange} /> */}
          {/* <DeleteFormDialog id={selectedId} open={isDeleteDialogOpen} onOpenChange={handleDeleteDialogOpenChange} /> */}
        </>
      )}
    </>
  )
}
