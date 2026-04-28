'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { removeRole } from '@/api/role'
import { UnauthorizedError } from '@/errors/unauthorized'
import { useCallback, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import useRoleStore from '@/stores/role'
import useSelfStore from '@/stores/self'

export function DeleteRoleDialog({
  id,
  open,
  onOpenChange,
}: {
  id: number | null
  open: boolean
  onOpenChange: (isOpen: boolean) => void
}) {
  const navigate = useNavigate()
  const { token } = useSelfStore()
  const { remove } = useRoleStore()
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const handleCancel = useCallback(() => {
    onOpenChange(false)
  }, [onOpenChange])

  const handleDelete = useCallback(async () => {
    if (id != null) {
      setIsLoading(true)
      try {
        await removeRole(token || '', id)
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
          <DialogTitle>Are you sure you want to delete this role?</DialogTitle>
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
