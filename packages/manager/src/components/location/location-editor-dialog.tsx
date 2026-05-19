'use client'

import { Button } from '@/components/ui/button'
import { createLocation, updateLocation } from '@/api/location'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldDescription, FieldError, FieldLabel } from '../ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '../ui/textarea'
import { UnauthorizedError } from '@/errors/unauthorized'
import { useCallback, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import useLocationStore from '@/stores/location'
import useSelfStore from '@/stores/self'
import type { Location } from '@/types/location'

interface FormData {
  id: number
  name: string
  mainImageName: string
  individualImageName: string
  backgroundImagePath: string
  color: string
  address: string
  startTime: string
  endTime: string
  description: string
}

const emptyFormData: FormData = {
  id: 0,
  name: '',
  mainImageName: '',
  individualImageName: '',
  backgroundImagePath: '',
  color: '',
  address: '',
  startTime: '',
  endTime: '',
  description: '',
}

const emptyFormError = {
  name: '',
  mainImageName: '',
  individualImageName: '',
  backgroundImagePath: '',
  color: '',
  address: '',
  startTime: '',
  endTime: '',
  description: '',
}

function dataFromLocation(location: Location): FormData {
  return {
    id: location.id,
    name: location.name,
    mainImageName: location.mainImageName,
    individualImageName: location.individualImageName,
    backgroundImagePath: location.backgroundImagePath,
    color: location.color,
    address: location.address,
    startTime: location.startTime,
    endTime: location.endTime,
    description: location.description,
  }
}

interface LocationEditorDialogProps {
  open: boolean
  onOpenChange: (isOpen: boolean) => void
  initialLocation?: Location
}

export function LocationEditorDialog({ open, onOpenChange, initialLocation }: LocationEditorDialogProps) {
  const navigate = useNavigate()
  const { token } = useSelfStore()
  const { populateSingle } = useLocationStore()

  const isEditing = initialLocation !== undefined

  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [formError, setFormError] = useState(emptyFormError)
  const [formData, setFormData] = useState<FormData>(emptyFormData)

  if (
    !open &&
    (formData.id !== 0 ||
      formData.name !== '' ||
      formData.mainImageName !== '' ||
      formData.individualImageName !== '' ||
      formData.backgroundImagePath !== '' ||
      formData.color !== '' ||
      formData.address !== '' ||
      formData.startTime !== '' ||
      formData.endTime !== '' ||
      formData.description !== '')
  ) {
    setFormData(emptyFormData)
    setFormError(emptyFormError)
  }

  if (open && formData.id === 0 && initialLocation != null) {
    setFormData(dataFromLocation(initialLocation))
  }

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }, [])

  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
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

      if (!formData.name.trim()) {
        hasError = true
        nextError.name = 'Please fill in this field'
      }

      if (!formData.mainImageName.trim()) {
        hasError = true
        nextError.mainImageName = 'Please fill in this field'
      }

      if (!formData.individualImageName.trim()) {
        hasError = true
        nextError.individualImageName = 'Please fill in this field'
      } else if (formData.individualImageName.trim().split('\n').length !== 3) {
        hasError = true
        nextError.individualImageName = 'This field must be 3 lines'
      }

      if (!formData.backgroundImagePath.trim()) {
        hasError = true
        nextError.backgroundImagePath = 'Please fill in this field'
      }

      if (!formData.color.trim()) {
        hasError = true
        nextError.color = 'Please fill in this field'
      }

      if (!formData.address.trim()) {
        hasError = true
        nextError.address = 'Please fill in this field'
      } else if (formData.address.trim().split('\n').length !== 2) {
        hasError = true
        nextError.address = 'This field must be 2 lines'
      }

      if (!formData.startTime.trim()) {
        hasError = true
        nextError.startTime = 'Please fill in this field'
      }

      if (!formData.endTime.trim()) {
        hasError = true
        nextError.endTime = 'Please fill in this field'
      }

      if (!formData.description.trim()) {
        hasError = true
        nextError.description = 'Please fill in this field'
      }

      setFormError(nextError)

      if (!hasError) {
        setIsLoading(true)
        try {
          const payload = {
            id: formData.id,
            name: formData.name.trim(),
            mainImageName: formData.mainImageName.trim(),
            individualImageName: formData.individualImageName.trim(),
            backgroundImagePath: formData.backgroundImagePath.trim(),
            color: formData.color.trim(),
            address: formData.address.trim(),
            startTime: formData.startTime.trim(),
            endTime: formData.endTime.trim(),
            description: formData.description.trim(),
          }
          const location = isEditing
            ? await updateLocation(token || '', payload)
            : await createLocation(token || '', payload)
          populateSingle(location)
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
          <DialogTitle>{isEditing ? 'Edit Location' : 'Create Location'}</DialogTitle>
        </DialogHeader>

        <div className="no-scrollbar -mx-4 max-h-[75vh] overflow-y-auto px-4">
          <form onSubmit={() => false}>
            <div className="mb-4">
              <Field>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                />
                <FieldError>{formError.name}</FieldError>
              </Field>
            </div>

            <div className="mb-4">
              <Field>
                <FieldLabel htmlFor="mainImageName">Name on the Main Image</FieldLabel>
                <Input
                  id="mainImageName"
                  name="mainImageName"
                  type="text"
                  value={formData.mainImageName}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                />
                <FieldError>{formError.mainImageName}</FieldError>
              </Field>
            </div>

            <div className="mb-4">
              <Field>
                <FieldLabel htmlFor="individualImageName">Name on the Individual Event Image</FieldLabel>
                <FieldDescription>This needs to be three lines</FieldDescription>
                <Textarea
                  id="individualImageName"
                  value={formData.individualImageName}
                  name="individualImageName"
                  rows={3}
                  disabled={isLoading}
                  onChange={handleTextareaChange}
                  required
                />
                <FieldError>{formError.individualImageName}</FieldError>
              </Field>
            </div>

            <div className="mb-4">
              <Field>
                <FieldLabel htmlFor="backgroundImagePath">Path to the background image</FieldLabel>
                <Input
                  id="backgroundImagePath"
                  name="backgroundImagePath"
                  type="text"
                  value={formData.backgroundImagePath}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                />
                <FieldError>{formError.backgroundImagePath}</FieldError>
              </Field>
            </div>

            <div className="mb-4">
              <Field>
                <FieldLabel htmlFor="color">Color for the individual event image header</FieldLabel>
                <Input
                  id="color"
                  name="color"
                  type="text"
                  value={formData.color}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                />
                <FieldError>{formError.color}</FieldError>
              </Field>
            </div>

            <div className="mb-4">
              <Field>
                <FieldLabel htmlFor="address">Address</FieldLabel>
                <FieldDescription>This needs to be two lines</FieldDescription>
                <Textarea
                  id="address"
                  value={formData.address}
                  name="address"
                  rows={2}
                  disabled={isLoading}
                  onChange={handleTextareaChange}
                  required
                />
                <FieldError>{formError.address}</FieldError>
              </Field>
            </div>

            <div className="mb-4">
              <Field>
                <FieldLabel htmlFor="startTime">Normal start time for the events at this location</FieldLabel>
                <Input
                  id="startTime"
                  name="startTime"
                  type="text"
                  value={formData.startTime}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                />
                <FieldError>{formError.startTime}</FieldError>
              </Field>
            </div>

            <div className="mb-4">
              <Field>
                <FieldLabel htmlFor="endTime">Normal end time for the events at this location</FieldLabel>
                <Input
                  id="endTime"
                  name="endTime"
                  type="text"
                  value={formData.endTime}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                />
                <FieldError>{formError.endTime}</FieldError>
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="description">Description</FieldLabel>
              <Textarea
                id="description"
                value={formData.description}
                name="description"
                rows={2}
                disabled={isLoading}
                onChange={handleTextareaChange}
                required
              />
              <FieldError>{formError.description}</FieldError>
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
