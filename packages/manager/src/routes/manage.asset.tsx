'use client'

import { AssetsTable } from '@/components/asset/assets-table'
import authGuard from '@/lib/auth-guard'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { DeleteAssetDialog } from '@/components/asset/delete-asset-dialog'
import { EditAssetDialog } from '@/components/asset/edit-asset-dialog'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { fetchAssets } from '@/api/asset'
import { Header } from '@/components/header'
import { Spinner } from '@/components/ui/spinner'
import { UnauthorizedError } from '@/errors/unauthorized'
import { Upload } from 'lucide-react'
import { UploadAssetDialog } from '@/components/asset/upload-asset-dialog'
import useAssetStore from '@/stores/asset'
import { useCallback, useEffect, useState } from 'react'
import useUserStore, { WRITE_PERMISSION } from '@/stores/user'

export const Route = createFileRoute('/manage/asset')({
  component: Assets,
  head: () => ({
    meta: [
      {
        title: 'Assets | OutClimb Management',
      },
    ],
  }),
  beforeLoad: ({ context, location }) => authGuard(context, location),
})

function Assets() {
  const navigate = useNavigate()
  const { hasPermission, token } = useUserStore()
  const { isEmpty, list, populate } = useAssetStore()

  const [isHydrated, setIsHydrated] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState<boolean>(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false)

  const handleUpload = useCallback(() => {
    setIsUploadDialogOpen(true)
  }, [setIsUploadDialogOpen])

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
    const fetchAssetsFromApi = async () => {
      setIsLoading(true)

      try {
        const locations = await fetchAssets(token || '')
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
      fetchAssetsFromApi()
    }
  })

  return (
    <>
      <Header
        actions={
          hasPermission('asset', WRITE_PERMISSION) && (
            <Button onClick={handleUpload} disabled={isLoading}>
              <Upload />
              Upload Asset
            </Button>
          )
        }>
        Assets
      </Header>

      <Card className="p-0">
        <CardContent className="p-0">
          {isLoading && (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Spinner />
                </EmptyMedia>
                <EmptyTitle>Loading assets...</EmptyTitle>
              </EmptyHeader>
            </Empty>
          )}

          {!isLoading && isEmpty() && (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Upload />
                </EmptyMedia>
                <EmptyTitle>No assets uploaded</EmptyTitle>
              </EmptyHeader>
            </Empty>
          )}

          {!isLoading && !isEmpty() && (
            <AssetsTable
              data={list()}
              canEdit={hasPermission('asset', WRITE_PERMISSION)}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </CardContent>
      </Card>

      {hasPermission('asset', WRITE_PERMISSION) && (
        <>
          <UploadAssetDialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen} />
          <EditAssetDialog id={selectedId} open={isEditDialogOpen} onOpenChange={handleEditDialogOpenChange} />
          <DeleteAssetDialog id={selectedId} open={isDeleteDialogOpen} onOpenChange={handleDeleteDialogOpenChange} />
        </>
      )}
    </>
  )
}
