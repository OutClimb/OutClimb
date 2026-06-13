'use client'

import { Button } from '@/components/ui/button'
import { createRedirect, updateRedirect } from '@/api/redirect'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldError, FieldLabel } from '../ui/field'
import { format, getTime } from 'date-fns'
import { Input } from '@/components/ui/input'
import { UnauthorizedError } from '@/errors/unauthorized'
import { useCallback, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import useRedirectStore from '@/stores/redirect'
import useSelfStore from '@/stores/self'
import type { Redirect } from '@/types/redirect'

interface FormData {
  id: number
  fromPath: string
  toUrl: string
  startsOn: string
  stopsOn: string
}

const emptyFormData: FormData = {
  id: 0,
  fromPath: '',
  toUrl: '',
  startsOn: '',
  stopsOn: '',
}

const emptyFormError = {
  fromPath: '',
  toUrl: '',
}

function dataFromRedirect(redirect: Redirect): FormData {
  return {
    id: redirect.id,
    fromPath: redirect.fromPath,
    toUrl: redirect.toUrl,
    startsOn: redirect.startsOn > 0 ? format(redirect.startsOn, 'yyyy-MM-dd') : '',
    stopsOn: redirect.stopsOn > 0 ? format(redirect.stopsOn, 'yyyy-MM-dd') : '',
  }
}

interface RedirectEditorDialogProps {
  open: boolean
  onOpenChange: (isOpen: boolean) => void
  initialRedirect?: Redirect
}

export function RedirectEditorDialog({ open, onOpenChange, initialRedirect }: RedirectEditorDialogProps) {
  const navigate = useNavigate()
  const { token } = useSelfStore()
  const { populateSingle } = useRedirectStore()

  const isEditing = initialRedirect !== undefined

  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [formError, setFormError] = useState(emptyFormError)
  const [formData, setFormData] = useState<FormData>(emptyFormData)

  if (
    !open &&
    (formData.id !== 0 ||
      formData.fromPath !== '' ||
      formData.toUrl !== '' ||
      formData.startsOn !== '' ||
      formData.stopsOn !== '')
  ) {
    setFormData(emptyFormData)
    setFormError(emptyFormError)
  }

  if (open && formData.id === 0 && initialRedirect != null) {
    setFormData(dataFromRedirect(initialRedirect))
  }

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }, [])

  const handleCancel = useCallback(() => {
    onOpenChange(false)
  }, [onOpenChange])

  const handleSubmit = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault()
      let hasError = false
      const nextError = { ...emptyFormError }

      if (!formData.fromPath.trim()) {
        hasError = true
        nextError.fromPath = 'Please fill in this field'
      }

      if (!formData.toUrl.trim()) {
        hasError = true
        nextError.toUrl = 'Please fill in this field'
      } else if (!formData.toUrl.trim().startsWith('http')) {
        hasError = true
        nextError.toUrl = 'URL must start with http or https'
      }

      setFormError(nextError)

      if (!hasError) {
        setIsLoading(true)
        try {
          const payload = {
            id: formData.id,
            fromPath: formData.fromPath.trim().replace(/^[/]+/m, ''),
            toUrl: formData.toUrl.trim(),
            startsOn: formData.startsOn ? getTime(formData.startsOn) : 0,
            stopsOn: formData.stopsOn ? getTime(formData.stopsOn) : 0,
          }
          const redirect = isEditing
            ? await updateRedirect(token || '', payload)
            : await createRedirect(token || '', payload)
          populateSingle(redirect)
          onOpenChange(false)
        } catch (error) {
          if (error instanceof UnauthorizedError) {
            navigate({ to: '/manage/login' })
          }
        }
        setIsLoading(false)
      }
    },
    [formData, isEditing, populateSingle, onOpenChange, token, navigate],
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Redirect' : 'Create Redirect'}</DialogTitle>
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
                <FieldError>{formError.fromPath}</FieldError>
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
                <FieldError>{formError.toUrl}</FieldError>
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
            {isEditing ? 'Save' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
