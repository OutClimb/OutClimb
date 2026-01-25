'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldLabel } from '../ui/field'
import { getTime, format } from 'date-fns'
import { Input } from '@/components/ui/input'
import { UnauthorizedError } from '@/errors/unauthorized'
import { updateRedirect } from '@/api/redirect'
import { useNavigate } from '@tanstack/react-router'
import useRedirectStore from '@/stores/redirect'
import { useCallback, useState } from 'react'
import useUserStore from '@/stores/user'

interface FormData {
  id: number
  fromPath: string
  toUrl: string
  startsOn: string
  stopsOn: string
}

interface EditLocationDialogProps {
  id: number | null
  open: boolean
  onOpenChange: (isOpen: boolean) => void
}

export function EditRedirectDialog({ id, open, onOpenChange }: EditLocationDialogProps) {
  const navigate = useNavigate()
  const { token } = useUserStore()
  const { data, populateSingle } = useRedirectStore()

  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [formError, setFormError] = useState({
    fromPath: '',
    toUrl: '',
  })
  const [formData, setFormData] = useState<FormData>({
    id: 0,
    fromPath: '',
    toUrl: '',
    startsOn: '',
    stopsOn: '',
  })

  if (
    !open &&
    ((formData.id !== 0 && formData.fromPath !== '') ||
      formData.toUrl !== '' ||
      formData.startsOn !== '' ||
      formData.stopsOn !== '')
  ) {
    setFormData({
      id: 0,
      fromPath: '',
      toUrl: '',
      startsOn: '',
      stopsOn: '',
    })
    setFormError({
      fromPath: '',
      toUrl: '',
    })
  }

  if (open && formData.id === 0 && id != null) {
    const currentRedirect = data[id]
    setFormData({
      id: currentRedirect.id,
      fromPath: currentRedirect.fromPath,
      toUrl: currentRedirect.toUrl,
      startsOn: currentRedirect.startsOn > 0 ? format(currentRedirect.startsOn, 'yyyy-MM-dd') : '',
      stopsOn: currentRedirect.stopsOn > 0 ? format(currentRedirect.stopsOn, 'yyyy-MM-dd') : '',
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
    },
    [setFormError, formData, setIsLoading, populateSingle, onOpenChange, token, navigate],
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Redirect</DialogTitle>
        </DialogHeader>

        <div className="no-scrollbar -mx-4 max-h-[75vh] overflow-y-auto px-4">
          <form onSubmit={() => false}>
            <div className="mb-4">
              <Field>
                <FieldLabel htmlFor="fromPath">From Path</FieldLabel>
                <Input
                  id="fromPath"
                  name="fromPath"
                  type="text"
                  value={formData.fromPath}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                />
                {formError.fromPath && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{formError.fromPath}</AlertDescription>
                  </Alert>
                )}
              </Field>
            </div>

            <div className="mb-4">
              <Field>
                <FieldLabel htmlFor="toUrl">To URL</FieldLabel>
                <Input
                  id="toUrl"
                  name="toUrl"
                  type="text"
                  value={formData.toUrl}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                />
                {formError.toUrl && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{formError.toUrl}</AlertDescription>
                  </Alert>
                )}
              </Field>
            </div>

            <div className="mb-4">
              <Field>
                <FieldLabel htmlFor="startsOn">Starts On</FieldLabel>
                <Input
                  id="startsOn"
                  name="startsOn"
                  type="text"
                  value={formData.startsOn}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="stopsOn">Stops On</FieldLabel>
              <Input
                id="stopsOn"
                name="stopsOn"
                type="text"
                value={formData.stopsOn}
                onChange={handleChange}
                disabled={isLoading}
              />
            </Field>
          </form>
        </div>

        <DialogFooter>
          <Button disabled={isLoading} variant="secondary" type="button" onClick={handleCancel}>
            Cancel
          </Button>
          <Button disabled={isLoading} variant="default" type="button" onClick={handleSubmit}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
