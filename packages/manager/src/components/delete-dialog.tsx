'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'
import { Trash2 } from 'lucide-react'
import { UnauthorizedError } from '@/errors/unauthorized'
import { useCallback, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import useSelfStore from '@/stores/self'

interface DeleteDialogProps {
  id: number | null
  open: boolean
  onOpenChange: (isOpen: boolean) => void
  label: string
  deleteFn: (token: string, id: number) => Promise<boolean>
  removeFromStore: (id: number) => void
}

export function DeleteDialog({ id, open, onOpenChange, label, deleteFn, removeFromStore }: DeleteDialogProps) {
  const navigate = useNavigate()
  const { token } = useSelfStore()
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const handleCancel = useCallback(() => {
    onOpenChange(false)
  }, [onOpenChange])

  const handleDelete = useCallback(async () => {
    if (id != null) {
      setIsLoading(true)
      try {
        await deleteFn(token || '', id)
        removeFromStore(id)
      } catch (error) {
        if (error instanceof UnauthorizedError) {
          navigate({ to: '/manage/login' })
        }
      }
    }
    onOpenChange(false)
    setIsLoading(false)
  }, [token, id, deleteFn, removeFromStore, onOpenChange, navigate])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm" showCloseButton={false}>
        <div className="flex items-start gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <Trash2 className="size-5" />
          </div>
          <DialogHeader className="pt-2 pr-0">
            <DialogTitle>Delete this {label}?</DialogTitle>
          </DialogHeader>
        </div>
        <DialogFooter>
          <Button disabled={isLoading} variant="secondary" onClick={handleCancel}>
            Cancel
          </Button>
          <Button disabled={isLoading} variant="destructive" onClick={handleDelete}>
            {isLoading ? <Spinner /> : <Trash2 />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
