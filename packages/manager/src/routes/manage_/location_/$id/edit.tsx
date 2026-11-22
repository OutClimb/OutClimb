'use client'

import authGuard from '@/lib/auth-guard'
import { Content } from '@/components/content'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { fetchLocation, updateLocation } from '@/api/location'
import { Header } from '@/components/header'
import { LocationEditor } from '@/components/location/location-editor'
import { MapPin } from 'lucide-react'
import permissionGuard from '@/lib/permission-guard'
import { Spinner } from '@/components/ui/spinner'
import { UnauthorizedError } from '@/errors/unauthorized'
import { useEffect, useState } from 'react'
import useLocationStore from '@/stores/location'
import useSelfStore, { WRITE_PERMISSION } from '@/stores/self'
import type { Location } from '@/types/location'
import type { LocationEditorPayload } from '@/components/location/location-editor'

export const Route = createFileRoute('/manage_/location_/$id/edit')({
  component: EditLocation,
  head: () => ({
    meta: [{ title: 'Edit Location | OutClimb Management' }],
  }),
  beforeLoad: ({ context, location }) =>
    Promise.all([authGuard(context, location), permissionGuard(context, 'location', WRITE_PERMISSION)]),
})

function EditLocation() {
  const { id: idParam } = Route.useParams()
  const id = Number(idParam)
  const navigate = useNavigate()
  const { token } = useSelfStore()
  const { populateSingle } = useLocationStore()

  const [location, setLocation] = useState<Location | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadLocation = async () => {
      setIsLoading(true)
      try {
        const fetched = await fetchLocation(token ?? '', id)
        populateSingle(fetched)
        setLocation(fetched)
      } catch (error) {
        if (error instanceof UnauthorizedError) {
          navigate({ to: '/manage/login' })
        }
      } finally {
        setIsLoading(false)
      }
    }
    loadLocation()
  }, [id, token, populateSingle, navigate])

  const handleSave = async (payload: LocationEditorPayload) => {
    if (!location) return
    try {
      const updated = await updateLocation(token ?? '', { id: location.id, ...payload })
      populateSingle(updated)
      navigate({ to: '/manage/location' })
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        navigate({ to: '/manage/login' })
      }
    }
  }

  return (
    <>
      <Header isLoading={isLoading} backTo="/manage/location">
        Edit Location
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

        {!isLoading && !location && (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <MapPin />
              </EmptyMedia>
              <EmptyTitle>Location not found</EmptyTitle>
            </EmptyHeader>
          </Empty>
        )}

        {location && (
          <LocationEditor
            initialLocation={location}
            onSave={handleSave}
            submitLabel="Save"
            submitLoadingLabel="Saving..."
          />
        )}
      </Content>
    </>
  )
}
