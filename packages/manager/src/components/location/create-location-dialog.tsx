'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createLocation } from '@/api/location'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldDescription, FieldLabel } from '../ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '../ui/textarea'
import { UnauthorizedError } from '@/errors/unauthorized'
import { useCallback, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import useLocationStore from '@/stores/location'
import useSelfStore from '@/stores/self'

interface FormData {
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

interface CreateLocationDialogProps {
  open: boolean
  onOpenChange: (isOpen: boolean) => void
}

export function CreateLocationDialog({ open, onOpenChange }: CreateLocationDialogProps) {
  const navigate = useNavigate()
  const { token } = useSelfStore()
  const { populateSingle } = useLocationStore()

  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [formError, setFormError] = useState({
    name: '',
    mainImageName: '',
    individualImageName: '',
    backgroundImagePath: '',
    color: '',
    address: '',
    startTime: '',
    endTime: '',
    description: '',
  })
  const [formData, setFormData] = useState<FormData>({
    name: '',
    mainImageName: '',
    individualImageName: '',
    backgroundImagePath: '',
    color: '',
    address: '',
    startTime: '',
    endTime: '',
    description: '',
  })

  if (
    !open &&
    (formData.name !== '' ||
      formData.mainImageName !== '' ||
      formData.individualImageName !== '' ||
      formData.backgroundImagePath !== '' ||
      formData.color !== '' ||
      formData.address !== '' ||
      formData.startTime !== '' ||
      formData.endTime !== '' ||
      formData.description !== '')
  ) {
    setFormData({
      name: '',
      mainImageName: '',
      individualImageName: '',
      backgroundImagePath: '',
      color: '',
      address: '',
      startTime: '',
      endTime: '',
      description: '',
    })
    setFormError({
      name: '',
      mainImageName: '',
      individualImageName: '',
      backgroundImagePath: '',
      color: '',
      address: '',
      startTime: '',
      endTime: '',
      description: '',
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

  const handleTextareaChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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
        name: '',
        mainImageName: '',
        individualImageName: '',
        backgroundImagePath: '',
        color: '',
        address: '',
        startTime: '',
        endTime: '',
        description: '',
      })

      if (!formData.name.trim()) {
        hasError = true
        setFormError((prev) => ({
          ...prev,
          name: 'Please fill in this field',
        }))
      }

      if (!formData.mainImageName.trim()) {
        hasError = true
        setFormError((prev) => ({
          ...prev,
          mainImageName: 'Please fill in this field',
        }))
      }

      if (!formData.individualImageName.trim()) {
        hasError = true
        setFormError((prev) => ({
          ...prev,
          individualImageName: 'Please fill in this field',
        }))
      } else if (formData.individualImageName.trim().split('\n').length !== 3) {
        hasError = true
        setFormError((prev) => ({
          ...prev,
          individualImageName: 'This field must be 3 lines',
        }))
      }

      if (!formData.backgroundImagePath.trim()) {
        hasError = true
        setFormError((prev) => ({
          ...prev,
          mainImageName: 'Please fill in this field',
        }))
      }

      if (!formData.color.trim()) {
        hasError = true
        setFormError((prev) => ({
          ...prev,
          mainImageName: 'Please fill in this field',
        }))
      }

      if (!formData.address.trim()) {
        hasError = true
        setFormError((prev) => ({
          ...prev,
          address: 'Please fill in this field',
        }))
      } else if (formData.address.trim().split('\n').length !== 2) {
        hasError = true
        setFormError((prev) => ({
          ...prev,
          address: 'This field must be 2 lines',
        }))
      }

      if (!formData.startTime.trim()) {
        hasError = true
        setFormError((prev) => ({
          ...prev,
          startTime: 'Please fill in this field',
        }))
      }

      if (!formData.endTime.trim()) {
        hasError = true
        setFormError((prev) => ({
          ...prev,
          endTime: 'Please fill in this field',
        }))
      }

      if (!formData.description.trim()) {
        hasError = true
        setFormError((prev) => ({
          ...prev,
          description: 'Please fill in this field',
        }))
      }

      if (!hasError) {
        setIsLoading(true)
        try {
          const location = await createLocation(token || '', {
            id: 0,
            name: formData.name.trim(),
            mainImageName: formData.mainImageName.trim(),
            individualImageName: formData.individualImageName.trim(),
            backgroundImagePath: formData.backgroundImagePath.trim(),
            color: formData.color.trim(),
            address: formData.address.trim(),
            startTime: formData.startTime.trim(),
            endTime: formData.endTime.trim(),
            description: formData.description.trim(),
          })
          populateSingle(location)
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
          <DialogTitle>Create Location</DialogTitle>
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
                {formError.name && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{formError.name}</AlertDescription>
                  </Alert>
                )}
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
                {formError.mainImageName && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{formError.mainImageName}</AlertDescription>
                  </Alert>
                )}
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
                {formError.individualImageName && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{formError.individualImageName}</AlertDescription>
                  </Alert>
                )}
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
                {formError.backgroundImagePath && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{formError.backgroundImagePath}</AlertDescription>
                  </Alert>
                )}
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
                {formError.color && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{formError.color}</AlertDescription>
                  </Alert>
                )}
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
                {formError.address && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{formError.address}</AlertDescription>
                  </Alert>
                )}
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
                {formError.startTime && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{formError.startTime}</AlertDescription>
                  </Alert>
                )}
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
                {formError.endTime && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{formError.endTime}</AlertDescription>
                  </Alert>
                )}
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
              {formError.description && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{formError.description}</AlertDescription>
                </Alert>
              )}
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
