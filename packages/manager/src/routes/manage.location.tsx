'use client'

import authGuard from '@/lib/auth-guard'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { fetchLocations } from '@/api/location'
import { Header } from '@/components/header'
import { LocationsTable } from '@/components/location/locations-table'
import { MapPin, Plus } from 'lucide-react'
import permissionGuard from '@/lib/permission-guard'
import { Spinner } from '@/components/ui/spinner'
import { UnauthorizedError } from '@/errors/unauthorized'
import { useCallback, useEffect, useState } from 'react'
import useLocationStore from '@/stores/location'
import useUserStore, { READ_PERMISSION, WRITE_PERMISSION } from '@/stores/user'
import { DeleteLocationDialog } from '@/components/location/delete-location-dialog'
import { CreateLocationDialog } from '@/components/location/create-location-dialog'
import { EditLocationDialog } from '@/components/location/edit-location-dialog'
import { Content } from '@/components/content'

export const Route = createFileRoute('/manage/location')({
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
  const { hasPermission, token } = useUserStore()
  const { isEmpty, list, populate } = useLocationStore()

  const [isHydrated, setIsHydrated] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState<boolean>(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false)

  const handleCreate = useCallback(() => {
    setIsCreateDialogOpen(true)
  }, [setIsCreateDialogOpen])

  const handleEdit = useCallback(
    (id: number) => {
      setSelectedId(id)
      setIsEditDialogOpen(true)
    },
    [setSelectedId, setIsEditDialogOpen],
  )

  const handleEditDialogOpenChange = useCallback(() => {
    setSelectedId(null)
    setIsEditDialogOpen(false)
  }, [])

  const handleDelete = useCallback(
    (id: number) => {
      setSelectedId(id)
      setIsDeleteDialogOpen(true)
    },
    [setSelectedId, setIsDeleteDialogOpen],
  )

  const handleDeleteDialogOpenChange = useCallback(() => {
    setSelectedId(null)
    setIsDeleteDialogOpen(false)
  }, [setSelectedId, setIsDeleteDialogOpen])

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
        actions={
          hasPermission('location', WRITE_PERMISSION) && (
            <Button onClick={handleCreate} disabled={isLoading}>
              <Plus />
              Create Location
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
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}
          </CardContent>
        </Card>
      </Content>

      {hasPermission('location', WRITE_PERMISSION) && (
        <>
          <CreateLocationDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />
          <EditLocationDialog id={selectedId} open={isEditDialogOpen} onOpenChange={handleEditDialogOpenChange} />
          <DeleteLocationDialog id={selectedId} open={isDeleteDialogOpen} onOpenChange={handleDeleteDialogOpenChange} />
        </>
      )}
    </>
  )
}
