'use client'

import authGuard from '@/lib/auth-guard'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Content } from '@/components/content'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { DeleteDialog } from '@/components/delete-dialog'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { fetchLocations, removeLocation } from '@/api/location'
import { Header } from '@/components/header'
import { LocationsTable } from '@/components/location/locations-table'
import { MapPin, Plus } from 'lucide-react'
import permissionGuard from '@/lib/permission-guard'
import { Spinner } from '@/components/ui/spinner'
import { UnauthorizedError } from '@/errors/unauthorized'
import { useCrudDialogs } from '@/lib/use-crud-dialogs'
import { useEffect, useState } from 'react'
import useLocationStore from '@/stores/location'
import useSelfStore, { READ_PERMISSION, WRITE_PERMISSION } from '@/stores/self'

export const Route = createFileRoute('/manage_/location')({
  component: Locations,
  head: () => ({
    meta: [
      {
        title: 'Event Locations | OutClimb Management',
      },
    ],
  }),
  beforeLoad: ({ context, location }) =>
    Promise.all([authGuard(context, location), permissionGuard(context, 'location', READ_PERMISSION)]),
})

function Locations() {
  const navigate = useNavigate()
  const { hasPermission, token } = useSelfStore()
  const { isEmpty, list, populate, remove } = useLocationStore()

  const [isHydrated, setIsHydrated] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const { selectedId, isDeleteDialogOpen, handleDelete, handleDeleteDialogOpenChange } = useCrudDialogs()

  useEffect(() => {
    const fetchLocationsFromApi = async () => {
      setIsLoading(true)

      try {
        const locations = await fetchLocations(token || '')
        populate(locations)
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
      fetchLocationsFromApi()
    }
  })

  return (
    <>
      <Header
        isLoading={isLoading}
        actions={
          hasPermission('location', WRITE_PERMISSION) && (
            <Button asChild disabled={isLoading}>
              <Link to="/manage/location/create">
                <Plus />
                Create Location
              </Link>
            </Button>
          )
        }>
        Event Locations
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
                  <EmptyTitle>Loading locations...</EmptyTitle>
                </EmptyHeader>
              </Empty>
            )}

            {!isLoading && isEmpty() && (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <MapPin />
                  </EmptyMedia>
                  <EmptyTitle>No locations added</EmptyTitle>
                </EmptyHeader>
              </Empty>
            )}

            {!isLoading && !isEmpty() && (
              <LocationsTable
                data={list()}
                canEdit={hasPermission('location', WRITE_PERMISSION)}
                onDelete={handleDelete}
              />
            )}
          </CardContent>
        </Card>
      </Content>

      {hasPermission('location', WRITE_PERMISSION) && (
        <DeleteDialog
          id={selectedId}
          open={isDeleteDialogOpen}
          onOpenChange={handleDeleteDialogOpenChange}
          label="location"
          deleteFn={removeLocation}
          removeFromStore={remove}
        />
      )}
    </>
  )
}
