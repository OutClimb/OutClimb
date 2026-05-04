'use client'

import authGuard from '@/lib/auth-guard'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Content } from '@/components/content'
import { createFileRoute } from '@tanstack/react-router'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Header } from '@/components/header'
import { Mail, Plus } from 'lucide-react'
import permissionGuard from '@/lib/permission-guard'
// import { Spinner } from '@/components/ui/spinner'
// import { UnauthorizedError } from '@/errors/unauthorized'
// import { useCallback, useEffect, useState } from 'react'
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
  // const navigate = useNavigate()
  const { hasPermission } = useSelfStore()
  // const { isEmpty, list, populate } = useFormStore()

  // const [isHydrated, setIsHydrated] = useState<boolean>(false)
  // const [isLoading, setIsLoading] = useState<boolean>(false)
  // const [selectedId, setSelectedId] = useState<number | null>(null)
  // const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false)

  // const handleDelete = useCallback(
  //   (id: number) => {
  //     setSelectedId(id)
  //     setIsDeleteDialogOpen(true)
  //   },
  //   [setSelectedId, setIsDeleteDialogOpen],
  // )

  // useEffect(() => {
  //   const fetchFormsFromApi = async () => {
  //     setIsLoading(true)

  //     try {
  //       const forms = await fetchForms(token || '')
  //       populate(forms)
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
  //     fetchFormsFromApi()
  //   }
  // })

  return (
    <>
      <Header
        actions={
          hasPermission('email', WRITE_PERMISSION) && (
            <Button>
              <Plus />
              Create Email
            </Button>
          )
        }>
        Emails
      </Header>

      <Content>
        <Card className="p-0">
          <CardContent className="p-0">
            {/* {isLoading && (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Spinner />
                  </EmptyMedia>
                  <EmptyTitle>Loading emails...</EmptyTitle>
                </EmptyHeader>
              </Empty>
            )} */}

            {/* {!isLoading && isEmpty() && ( */}
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Mail />
                  </EmptyMedia>
                  <EmptyTitle>No emails added</EmptyTitle>
                </EmptyHeader>
              </Empty>
            {/* )} */}
          </CardContent>
        </Card>
      </Content>

    </>
  )
}
