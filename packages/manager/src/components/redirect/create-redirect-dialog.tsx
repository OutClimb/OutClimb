'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createRedirect } from '@/api/redirect'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldLabel } from '../ui/field'
import { getTime } from 'date-fns'
import { Input } from '@/components/ui/input'
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
    (formData.fromPath !== '' ||
      formData.toUrl !== '' ||
      formData.startsOn !== undefined ||
      formData.stopsOn !== undefined)
  ) {
    setFormData({
      fromPath: '',
      toUrl: '',
      startsOn: undefined,
      stopsOn: undefined,
    })
    setFormError({
      fromPath: '',
      toUrl: '',
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

      if (!formData.fromPath.trim()) {
        hasError = true
        setFormError((prev) => ({
          ...prev,
          fromPath: 'Please fill in this field',
        }))
      }

      if (!formData.toUrl.trim()) {
        hasError = true
        setFormError((prev) => ({
          ...prev,
          toUrl: 'Please fill in this field',
        }))
      } else if (!formData.toUrl.trim().startsWith('https')) {
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
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
