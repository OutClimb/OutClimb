'use client'

import { Button } from '@/components/ui/button'
import { createRedirect, updateRedirect } from '@/api/redirect'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '../ui/field'
import { formatInTimezone, parseInTimezone } from '@/lib/timezone'
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
  startsOn: '',
  stopsOn: '',
}

function dataFromRedirect(redirect: Redirect): FormData {
  return {
    id: redirect.id,
    fromPath: redirect.fromPath,
    toUrl: redirect.toUrl,
    startsOn: redirect.startsOn > 0 ? formatInTimezone(redirect.startsOn, "yyyy-MM-dd'T'HH:mm") : '',
    stopsOn: redirect.stopsOn > 0 ? formatInTimezone(redirect.stopsOn, "yyyy-MM-dd'T'HH:mm") : '',
  }
}

interface RedirectEditorDialogProps {
  open: boolean
  onOpenChange: (isOpen: boolean) => void
  initialRedirect?: Redirect
  isDuplicate?: boolean
}

export function RedirectEditorDialog({
  open,
  onOpenChange,
  initialRedirect,
  isDuplicate = false,
}: RedirectEditorDialogProps) {
  const navigate = useNavigate()
  const { token } = useSelfStore()
  const { populateSingle } = useRedirectStore()

  const isEditing = initialRedirect !== undefined && !isDuplicate

  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [formError, setFormError] = useState(emptyFormError)
  const [formData, setFormData] = useState<FormData>(emptyFormData)
  const [isPopulated, setIsPopulated] = useState<boolean>(false)

  if (
    !open &&
    (isPopulated ||
      formData.id !== 0 ||
      formData.fromPath !== '' ||
      formData.toUrl !== '' ||
      formData.startsOn !== '' ||
      formData.stopsOn !== '')
  ) {
    setFormData(emptyFormData)
    setFormError(emptyFormError)
    setIsPopulated(false)
  }

  if (open && !isPopulated && initialRedirect != null) {
    const data = dataFromRedirect(initialRedirect)
    setFormData(isDuplicate ? { ...data, id: 0, fromPath: `${data.fromPath}-copy` } : data)
    setIsPopulated(true)
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

      if (formData.startsOn && parseInTimezone(formData.startsOn) === null) {
        hasError = true
        nextError.startsOn = 'Invalid date'
      }

      if (formData.stopsOn && parseInTimezone(formData.stopsOn) === null) {
        hasError = true
        nextError.stopsOn = 'Invalid date'
      }

      setFormError(nextError)

      if (!hasError) {
        setIsLoading(true)
        try {
          const payload = {
            id: formData.id,
            fromPath: formData.fromPath.trim().replace(/^[/]+/m, ''),
            toUrl: formData.toUrl.trim(),
            startsOn: parseInTimezone(formData.startsOn) ?? 0,
            stopsOn: parseInTimezone(formData.stopsOn) ?? 0,
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
          <DialogTitle>
            {isEditing ? 'Edit Redirect' : isDuplicate ? 'Duplicate Redirect' : 'Create Redirect'}
          </DialogTitle>
        </DialogHeader>

        <div className="no-scrollbar -mx-6 -my-1 max-h-[70vh] overflow-y-auto px-6 py-1">
          <form onSubmit={() => false}>
            <FieldGroup>
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

              <Field>
                <FieldLabel htmlFor="startsOn">Starts On</FieldLabel>
                <FieldDescription>Leave blank to start immediately</FieldDescription>
                <Input
                  id="startsOn"
                  name="startsOn"
                  type="datetime-local"
                  value={formData.startsOn}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                <FieldError>{formError.startsOn}</FieldError>
              </Field>

              <Field>
                <FieldLabel htmlFor="stopsOn">Stops On</FieldLabel>
                <FieldDescription>Leave blank to never stop</FieldDescription>
                <Input
                  id="stopsOn"
                  name="stopsOn"
                  type="datetime-local"
                  value={formData.stopsOn}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                <FieldError>{formError.stopsOn}</FieldError>
              </Field>
            </FieldGroup>
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
