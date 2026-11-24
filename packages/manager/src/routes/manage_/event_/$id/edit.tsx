'use client'

import authGuard from '@/lib/auth-guard'
import { CalendarDays } from 'lucide-react'
import { Content } from '@/components/content'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { EventEditor } from '@/components/event/event-editor'
import { fetchEvent, updateEvent } from '@/api/event'
import { Header } from '@/components/header'
import permissionGuard from '@/lib/permission-guard'
import { Spinner } from '@/components/ui/spinner'
import { UnauthorizedError } from '@/errors/unauthorized'
import { useEffect, useState } from 'react'
import useEventStore from '@/stores/event'
import useSelfStore, { READ_PERMISSION, WRITE_PERMISSION } from '@/stores/self'
import type { Event, EventRequest } from '@/types/event'

export const Route = createFileRoute('/manage_/event_/$id/edit')({
  component: EditEvent,
  head: () => ({
    meta: [{ title: 'Edit Event | OutClimb Management' }],
  }),
  beforeLoad: ({ context, location }) =>
    Promise.all([
      authGuard(context, location),
      permissionGuard(context, 'event', WRITE_PERMISSION),
      permissionGuard(context, 'asset', READ_PERMISSION),
      permissionGuard(context, 'location', READ_PERMISSION),
    ]),
})

function EditEvent() {
  const { id: idParam } = Route.useParams()
  const id = Number(idParam)
  const navigate = useNavigate()
  const { token } = useSelfStore()
  const { populateSingle } = useEventStore()

  const [event, setEvent] = useState<Event | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadEvent = async () => {
      setIsLoading(true)
      try {
        const fetched = await fetchEvent(token ?? '', id)
        populateSingle(fetched)
        setEvent(fetched)
      } catch (error) {
        if (error instanceof UnauthorizedError) {
          navigate({ to: '/manage/login' })
        }
      } finally {
        setIsLoading(false)
      }
    }
    loadEvent()
  }, [id, token, populateSingle, navigate])

  const handleSave = async (request: EventRequest) => {
    if (!event) return
    try {
      const updated = await updateEvent(token ?? '', event.id, request)
      populateSingle(updated)
      navigate({ to: '/manage/event' })
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        navigate({ to: '/manage/login' })
        return
      }
      throw error
    }
  }

  return (
    <>
      <Header isLoading={isLoading} backTo="/manage/event">
        Edit Event
      </Header>

      <Content>
        {isLoading && (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Spinner />
              </EmptyMedia>
              <EmptyTitle>Loading...</EmptyTitle>
            </EmptyHeader>
          </Empty>
        )}

        {!isLoading && !event && (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <CalendarDays />
              </EmptyMedia>
              <EmptyTitle>Event not found</EmptyTitle>
            </EmptyHeader>
          </Empty>
        )}

        {event && (
          <EventEditor initialEvent={event} onSave={handleSave} submitLabel="Save" submitLoadingLabel="Saving..." />
        )}
      </Content>
    </>
  )
}
