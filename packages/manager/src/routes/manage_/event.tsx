'use client'

import authGuard from '@/lib/auth-guard'
import { CalendarDays } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Content } from '@/components/content'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { DeleteDialog } from '@/components/delete-dialog'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { EventsTable } from '@/components/event/events-table'
import { fetchEvents, removeEvent } from '@/api/event'
import { Header } from '@/components/header'
import permissionGuard from '@/lib/permission-guard'
import { Spinner } from '@/components/ui/spinner'
import { UnauthorizedError } from '@/errors/unauthorized'
import { useCrudDialogs } from '@/lib/use-crud-dialogs'
import { useEffect, useState } from 'react'
import useEventStore from '@/stores/event'
import useSelfStore, { READ_PERMISSION, WRITE_PERMISSION } from '@/stores/self'

export const Route = createFileRoute('/manage_/event')({
  component: Events,
  head: () => ({
    meta: [
      {
        title: 'Events | OutClimb Management',
      },
    ],
  }),
  beforeLoad: ({ context, location }) =>
    Promise.all([authGuard(context, location), permissionGuard(context, 'event', READ_PERMISSION)]),
})

function Events() {
  const navigate = useNavigate()
  const { hasPermission, token } = useSelfStore()
  const { isEmpty, list, populate, remove } = useEventStore()

  const [isHydrated, setIsHydrated] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const { selectedId, isDeleteDialogOpen, handleDelete, handleDeleteDialogOpenChange } = useCrudDialogs()

  useEffect(() => {
    const fetchEventsFromApi = async () => {
      setIsLoading(true)

      try {
        const events = await fetchEvents(token || '')
        populate(events)
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
      fetchEventsFromApi()
    }
  })

  return (
    <>
      <Header isLoading={isLoading}>Events</Header>

      <Content>
        <Card className="p-0">
          <CardContent className="p-0">
            {isLoading && (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Spinner />
                  </EmptyMedia>
                  <EmptyTitle>Loading events...</EmptyTitle>
                </EmptyHeader>
              </Empty>
            )}

            {!isLoading && isEmpty() && (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <CalendarDays />
                  </EmptyMedia>
                  <EmptyTitle>No events added</EmptyTitle>
                </EmptyHeader>
              </Empty>
            )}

            {!isLoading && !isEmpty() && (
              <EventsTable data={list()} canEdit={hasPermission('event', WRITE_PERMISSION)} onDelete={handleDelete} />
            )}
          </CardContent>
        </Card>
      </Content>

      {hasPermission('event', WRITE_PERMISSION) && (
        <DeleteDialog
          id={selectedId}
          open={isDeleteDialogOpen}
          onOpenChange={handleDeleteDialogOpenChange}
          label="event"
          deleteFn={removeEvent}
          removeFromStore={remove}
        />
      )}
    </>
  )
}
