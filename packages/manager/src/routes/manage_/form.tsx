'use client'

import authGuard from '@/lib/auth-guard'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Content } from '@/components/content'
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { DeleteFormDialog } from '@/components/form/delete-form-dialog'
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
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false)

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
            <Button asChild disabled={isLoading}>
              <Link to="/manage/form/create">
                <Plus />
                Create Form
              </Link>
            </Button>
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
        <DeleteFormDialog
          id={selectedId}
          open={isDeleteDialogOpen}
          onOpenChange={(isOpen) => {
            if (!isOpen) setSelectedId(null)
            setIsDeleteDialogOpen(isOpen)
          }}
        />
      )}
    </>
  )
}
