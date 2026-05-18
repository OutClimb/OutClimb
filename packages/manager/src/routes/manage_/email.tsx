'use client'

import authGuard from '@/lib/auth-guard'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Content } from '@/components/content'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { DeleteDialog } from '@/components/delete-dialog'
import { EmailsTable } from '@/components/email/emails-table'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { fetchEmails, removeEmail } from '@/api/email'
import { Header } from '@/components/header'
import { Mail, Plus } from 'lucide-react'
import permissionGuard from '@/lib/permission-guard'
import { Spinner } from '@/components/ui/spinner'
import { UnauthorizedError } from '@/errors/unauthorized'
import { useCrudDialogs } from '@/lib/use-crud-dialogs'
import { useEffect, useState } from 'react'
import useEmailStore from '@/stores/email'
import useSelfStore, { READ_PERMISSION, WRITE_PERMISSION } from '@/stores/self'

export const Route = createFileRoute('/manage_/email')({
  component: Forms,
  head: () => ({
    meta: [
      {
        title: 'Emails | OutClimb Management',
      },
    ],
  }),
  beforeLoad: ({ context, location }) =>
    Promise.all([authGuard(context, location), permissionGuard(context, 'email', READ_PERMISSION)]),
})

function Forms() {
  const navigate = useNavigate()
  const { hasPermission, token } = useSelfStore()
  const { isEmpty, list, populate, remove } = useEmailStore()

  const [isHydrated, setIsHydrated] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const { selectedId, isDeleteDialogOpen, handleDelete, handleDeleteDialogOpenChange } = useCrudDialogs()

  useEffect(() => {
    const fetchFormsFromApi = async () => {
      setIsLoading(true)

      try {
        const forms = await fetchEmails(token || '')
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
          hasPermission('email', WRITE_PERMISSION) && (
            <Button asChild disabled={isLoading}>
              <Link to="/manage/email/create">
                <Plus />
                Create Email
              </Link>
            </Button>
          )
        }>
        Emails
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
                  <EmptyTitle>Loading emails...</EmptyTitle>
                </EmptyHeader>
              </Empty>
            )}

            {!isLoading && isEmpty() && (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Mail />
                  </EmptyMedia>
                  <EmptyTitle>No emails added</EmptyTitle>
                </EmptyHeader>
              </Empty>
            )}

            {!isLoading && !isEmpty() && (
              <EmailsTable data={list()} canEdit={hasPermission('email', WRITE_PERMISSION)} onDelete={handleDelete} />
            )}
          </CardContent>
        </Card>
      </Content>

      {hasPermission('email', WRITE_PERMISSION) && (
        <DeleteDialog
          id={selectedId}
          open={isDeleteDialogOpen}
          onOpenChange={handleDeleteDialogOpenChange}
          label="email"
          deleteFn={removeEmail}
          removeFromStore={remove}
        />
      )}
    </>
  )
}
