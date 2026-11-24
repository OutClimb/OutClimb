'use client'

import authGuard from '@/lib/auth-guard'
import { Content } from '@/components/content'
import { createEvent } from '@/api/event'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { EventEditor } from '@/components/event/event-editor'
import { Header } from '@/components/header'
import permissionGuard from '@/lib/permission-guard'
import { UnauthorizedError } from '@/errors/unauthorized'
import useEventStore from '@/stores/event'
import useSelfStore, { READ_PERMISSION, WRITE_PERMISSION } from '@/stores/self'
import type { EventRequest } from '@/types/event'

export const Route = createFileRoute('/manage_/event_/create')({
  component: CreateEvent,
  head: () => ({
    meta: [{ title: 'Create Event | OutClimb Management' }],
  }),
  beforeLoad: ({ context, location }) =>
    Promise.all([
      authGuard(context, location),
      permissionGuard(context, 'event', WRITE_PERMISSION),
      permissionGuard(context, 'asset', READ_PERMISSION),
      permissionGuard(context, 'location', READ_PERMISSION),
    ]),
})

function CreateEvent() {
  const navigate = useNavigate()
  const { token } = useSelfStore()
  const { populateSingle } = useEventStore()

  const handleSave = async (request: EventRequest) => {
    try {
      const event = await createEvent(token ?? '', request)
      populateSingle(event)
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
      <Header backTo="/manage/event">Create Event</Header>
      <Content>
        <EventEditor onSave={handleSave} submitLabel="Create" submitLoadingLabel="Creating..." />
      </Content>
    </>
  )
}
