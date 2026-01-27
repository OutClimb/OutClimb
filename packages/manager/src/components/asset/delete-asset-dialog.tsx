'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { removeAsset } from '@/api/asset'
import { UnauthorizedError } from '@/errors/unauthorized'
import useAssetStore from '@/stores/asset'
import { useCallback, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import useUserStore from '@/stores/user'

export function DeleteAssetDialog({
  id,
  open,
  onOpenChange,
}: {
  id: number | null
  open: boolean
  onOpenChange: (isOpen: boolean) => void
}) {
  const navigate = useNavigate()
  const { token } = useUserStore()
  const { remove } = useAssetStore()
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const handleCancel = useCallback(() => {
    onOpenChange(false)
  }, [onOpenChange])

  const handleDelete = useCallback(async () => {
    if (id != null) {
      setIsLoading(true)
      try {
        await removeAsset(token || '', id)
      } catch (error) {
        if (error instanceof UnauthorizedError) {
          navigate({
            to: '/manage/login',
          })
        } else {
          // Handle error
        }
      }
      remove(id)
    }

    onOpenChange(false)
    setIsLoading(false)
  }, [setIsLoading, token, id, remove, onOpenChange, navigate])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you sure you want to delete this asset?</DialogTitle>
        </DialogHeader>

        <DialogFooter>
          <Button disabled={isLoading} variant="secondary" onClick={handleCancel}>
            No
          </Button>
          <Button disabled={isLoading} variant="destructive" onClick={handleDelete}>
            Yes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
