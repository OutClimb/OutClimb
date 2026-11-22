'use client'

import authGuard from '@/lib/auth-guard'
import { Content } from '@/components/content'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { createLocation } from '@/api/location'
import { Header } from '@/components/header'
import { LocationEditor } from '@/components/location/location-editor'
import permissionGuard from '@/lib/permission-guard'
import { UnauthorizedError } from '@/errors/unauthorized'
import useLocationStore from '@/stores/location'
import useSelfStore, { WRITE_PERMISSION } from '@/stores/self'
import type { LocationEditorPayload } from '@/components/location/location-editor'

export const Route = createFileRoute('/manage_/location_/create')({
  component: CreateLocation,
  head: () => ({
    meta: [{ title: 'Create Location | OutClimb Management' }],
  }),
  beforeLoad: ({ context, location }) =>
    Promise.all([authGuard(context, location), permissionGuard(context, 'location', WRITE_PERMISSION)]),
})

function CreateLocation() {
  const navigate = useNavigate()
  const { token } = useSelfStore()
  const { populateSingle } = useLocationStore()

  const handleSave = async (payload: LocationEditorPayload) => {
    try {
      const location = await createLocation(token ?? '', { id: 0, ...payload })
      populateSingle(location)
      navigate({ to: '/manage/location' })
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        navigate({ to: '/manage/login' })
      }
    }
  }

  return (
    <>
      <Header backTo="/manage/location">Create Location</Header>
      <Content>
        <LocationEditor onSave={handleSave} submitLabel="Create" submitLoadingLabel="Creating..." />
      </Content>
    </>
  )
}
