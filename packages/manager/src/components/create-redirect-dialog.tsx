'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createRedirect } from '@/api/redirect'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { getTime } from 'date-fns'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UnauthorizedError } from '@/errors/unauthorized'
import { useCallback, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import useRedirectStore from '@/stores/redirect'
import useUserStore from '@/stores/user'

interface FormData {
  fromPath: string
  toUrl: string
  startsOn: string | undefined
  stopsOn: string | undefined
}

interface CreateRedirectDialogProps {
  open: boolean
  onOpenChange: (isOpen: boolean) => void
}

export function CreateRedirectDialog({ open, onOpenChange }: CreateRedirectDialogProps) {
  const navigate = useNavigate()
  const { token } = useUserStore()
  const { populateSingle } = useRedirectStore()
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [formError, setFormError] = useState({
    fromPath: '',
    toUrl: '',
  })
  const [formData, setFormData] = useState<FormData>({
    fromPath: '',
    toUrl: '',
    startsOn: undefined,
    stopsOn: undefined,
  })

  if (
    !open &&
    formData.fromPath !== '' &&
    formData.toUrl !== '' &&
    formData.startsOn !== undefined &&
    formData.stopsOn !== undefined
  ) {
    setFormData({
      fromPath: '',
      toUrl: '',
      startsOn: undefined,
      stopsOn: undefined,
    })
  }

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    },
    [setFormData],
  )

  const handleCancel = useCallback(() => {
    onOpenChange(false)
  }, [onOpenChange])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      let hasError = false
      setFormError({
        fromPath: '',
        toUrl: '',
      })

      if (!formData.fromPath) {
        hasError = true
        setFormError((prev) => ({
          ...prev,
          fromPath: 'Please fill in this field',
        }))
      }

      if (!formData.toUrl) {
        hasError = true
        setFormError((prev) => ({
          ...prev,
          toUrl: 'Please fill in this field',
        }))
      } else if (!formData.toUrl.startsWith('https')) {
        hasError = true
        setFormError((prev) => ({
          ...prev,
          toUrl: 'URL must start with https',
        }))
      }

      if (!hasError) {
        setIsLoading(true)
        try {
          const redirect = await createRedirect(token || '', {
            id: 0,
            fromPath: formData.fromPath.trim().replace(/^[/]+/m, ''),
            startsOn: formData.startsOn ? getTime(formData.startsOn) : 0,
            stopsOn: formData.stopsOn ? getTime(formData.stopsOn) : 0,
            toUrl: formData.toUrl.trim(),
          })
          populateSingle(redirect)
          onOpenChange(false)
        } catch (error) {
          if (error instanceof UnauthorizedError) {
            navigate({
              to: '/manage/login',
            })
          } else {
            // Handle error
          }
        }
        setIsLoading(false)
      }
    },
    [setFormError, formData, setIsLoading, populateSingle, onOpenChange, token, navigate],
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Redirect</DialogTitle>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="fromPath">From Path</Label>
            <Input
              id="fromPath"
              name="fromPath"
              type="text"
              value={formData.fromPath}
              onChange={handleChange}
              disabled={isLoading}
            />
            {formError.fromPath && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{formError.fromPath}</AlertDescription>
              </Alert>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="toUrl">To URL</Label>
            <Input
              id="toUrl"
              name="toUrl"
              type="text"
              value={formData.toUrl}
              onChange={handleChange}
              disabled={isLoading}
            />
            {formError.toUrl && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{formError.toUrl}</AlertDescription>
              </Alert>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="startsOn">Starts On</Label>
            <Input
              id="startsOn"
              name="startsOn"
              type="date"
              value={formData.startsOn}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stopsOn">Stops On</Label>
            <Input
              id="stopsOn"
              name="stopsOn"
              type="date"
              value={formData.stopsOn}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          <DialogFooter>
            <Button disabled={isLoading} variant="secondary" type="button" onClick={handleCancel}>
              Cancel
            </Button>
            <Button disabled={isLoading} variant="default" type="submit">
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
