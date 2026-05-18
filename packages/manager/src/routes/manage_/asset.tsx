'use client'

import { AssetsTable } from '@/components/asset/assets-table'
import authGuard from '@/lib/auth-guard'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Content } from '@/components/content'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { DeleteDialog } from '@/components/delete-dialog'
import { AssetEditorDialog } from '@/components/asset/asset-editor-dialog'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { fetchAssets, removeAsset } from '@/api/asset'
import { Header } from '@/components/header'
import { Spinner } from '@/components/ui/spinner'
import { UnauthorizedError } from '@/errors/unauthorized'
import { Upload } from 'lucide-react'
import useAssetStore from '@/stores/asset'
import { useCrudDialogs } from '@/lib/use-crud-dialogs'
import { useEffect, useState } from 'react'
import useSelfStore, { WRITE_PERMISSION } from '@/stores/self'

export const Route = createFileRoute('/manage_/asset')({
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
  const { hasPermission, token } = useSelfStore()
  const { data, isEmpty, list, populate, remove } = useAssetStore()

  const [isHydrated, setIsHydrated] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const {
    selectedId,
    isEditorOpen,
    handleEditorOpenChange,
    isDeleteDialogOpen,
    handleCreate,
    handleEdit,
    handleDelete,
    handleDeleteDialogOpenChange,
  } = useCrudDialogs()

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
            <Button onClick={handleCreate} disabled={isLoading}>
              <Upload />
              Upload Asset
            </Button>
          )
        }>
        Assets
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
      </Content>

      {hasPermission('asset', WRITE_PERMISSION) && (
        <>
          <AssetEditorDialog
            open={isEditorOpen}
            onOpenChange={handleEditorOpenChange}
            initialAsset={selectedId != null ? data[selectedId] : undefined}
          />
          <DeleteDialog
            id={selectedId}
            open={isDeleteDialogOpen}
            onOpenChange={handleDeleteDialogOpenChange}
            label="asset"
            deleteFn={removeAsset}
            removeFromStore={remove}
          />
        </>
      )}
    </>
  )
}
