'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { getTime, format } from 'date-fns'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UnauthorizedError } from '@/errors/unauthorized'
import { updateRedirect } from '@/api/redirect'
import { useNavigate } from '@tanstack/react-router'
import useRedirectStore from '@/stores/redirect'
import { useState } from 'react'
import useUserStore from '@/stores/user'

export function EditRedirectDialog({
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
  const { data, populateSingle } = useRedirectStore()

  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [formError, setFormError] = useState({
    fromPath: '',
    toUrl: '',
  })
  const [formData, setFormData] = useState({
    id: 0,
    fromPath: '',
    toUrl: '',
    startsOn: '',
    stopsOn: '',
  })

  if (formData.id === 0 && id != null) {
    const currentRedirect = data[id]
    setFormData({
      id: currentRedirect.id,
      fromPath: currentRedirect.fromPath,
      toUrl: currentRedirect.toUrl,
      startsOn: currentRedirect.startsOn > 0 ? format(currentRedirect.startsOn, 'yyyy-MM-dd') : '',
      stopsOn: currentRedirect.stopsOn > 0 ? format(currentRedirect.stopsOn, 'yyyy-MM-dd') : '',
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  const handleSave = async (e: React.FormEvent) => {
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
    } else if (!formData.toUrl.startsWith('http')) {
      hasError = true
      setFormError((prev) => ({
        ...prev,
        toUrl: 'URL must start with http or https',
      }))
    }

    if (!hasError) {
      setIsLoading(true)
      try {
        const redirect = await updateRedirect(token || '', {
          id: formData.id,
          fromPath: formData.fromPath.trim().replace(/^[/]+/m, ''),
          toUrl: formData.toUrl.trim(),
          startsOn: formData.startsOn ? getTime(formData.startsOn) : 0,
          stopsOn: formData.stopsOn ? getTime(formData.stopsOn) : 0,
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
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Redirect</DialogTitle>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={handleSave}>
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
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
