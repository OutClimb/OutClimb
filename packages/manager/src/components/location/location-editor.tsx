'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { FormActions } from '@/components/form-actions'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { useCallback, useState } from 'react'
import type { Location } from '@/types/location'

const INDIVIDUAL_IMAGE_NAME_LINE_COUNT = 3
const REQUIRED_FIELD_MESSAGE = 'Please fill in this field'

export type LocationEditorPayload = Omit<Location, 'id'>

type EditorData = LocationEditorPayload
type EditorErrors = Record<keyof EditorData, string>

const emptyData: EditorData = {
  name: '',
  mainImageName: '',
  individualImageName: '',
  backgroundImagePath: '',
  color: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  startTime: '',
  endTime: '',
  description: '',
}

const emptyErrors: EditorErrors = {
  name: '',
  mainImageName: '',
  individualImageName: '',
  backgroundImagePath: '',
  color: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  startTime: '',
  endTime: '',
  description: '',
}

function dataFromLocation(location: Location): EditorData {
  return {
    name: location.name,
    mainImageName: location.mainImageName,
    individualImageName: location.individualImageName,
    backgroundImagePath: location.backgroundImagePath,
    color: location.color,
    address: location.address,
    city: location.city,
    state: location.state,
    zip: location.zip,
    startTime: location.startTime,
    endTime: location.endTime,
    description: location.description,
  }
}

function validate(data: EditorData): EditorErrors {
  const errors = { ...emptyErrors }

  for (const key of Object.keys(data) as Array<keyof EditorData>) {
    if (!data[key].trim()) {
      errors[key] = REQUIRED_FIELD_MESSAGE
    }
  }

  if (
    !errors.individualImageName &&
    data.individualImageName.trim().split('\n').length !== INDIVIDUAL_IMAGE_NAME_LINE_COUNT
  ) {
    errors.individualImageName = `This field must be ${INDIVIDUAL_IMAGE_NAME_LINE_COUNT} lines`
  }

  return errors
}

function trimData(data: EditorData): EditorData {
  const trimmed = { ...data }
  for (const key of Object.keys(trimmed) as Array<keyof EditorData>) {
    trimmed[key] = trimmed[key].trim()
  }
  return trimmed
}

interface LocationEditorProps {
  initialLocation?: Location
  onSave: (payload: LocationEditorPayload) => Promise<void>
  submitLabel: string
  submitLoadingLabel: string
}

export function LocationEditor({ initialLocation, onSave, submitLabel, submitLoadingLabel }: LocationEditorProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<EditorData>(() =>
    initialLocation ? dataFromLocation(initialLocation) : emptyData,
  )
  const [formErrors, setFormErrors] = useState<EditorErrors>(emptyErrors)

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()

      const errors = validate(formData)
      setFormErrors(errors)
      if (Object.values(errors).some(Boolean)) return

      setIsLoading(true)
      try {
        await onSave(trimData(formData))
      } finally {
        setIsLoading(false)
      }
    },
    [formData, onSave],
  )

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                disabled={isLoading}
              />
              <FieldError>{formErrors.name}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="address">Address</FieldLabel>
              <Textarea
                id="address"
                name="address"
                rows={2}
                value={formData.address}
                onChange={handleChange}
                disabled={isLoading}
              />
              <FieldError>{formErrors.address}</FieldError>
            </Field>
            <div className="grid gap-5 sm:grid-cols-3">
              <Field>
                <FieldLabel htmlFor="city">City</FieldLabel>
                <Input
                  id="city"
                  name="city"
                  type="text"
                  value={formData.city}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                <FieldError>{formErrors.city}</FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor="state">State</FieldLabel>
                <Input
                  id="state"
                  name="state"
                  type="text"
                  value={formData.state}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                <FieldError>{formErrors.state}</FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor="zip">Zip</FieldLabel>
                <Input
                  id="zip"
                  name="zip"
                  type="text"
                  value={formData.zip}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                <FieldError>{formErrors.zip}</FieldError>
              </Field>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Default times</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="startTime">Start time</FieldLabel>
              <Input
                id="startTime"
                name="startTime"
                type="text"
                value={formData.startTime}
                onChange={handleChange}
                disabled={isLoading}
              />
              <FieldError>{formErrors.startTime}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="endTime">End time</FieldLabel>
              <Input
                id="endTime"
                name="endTime"
                type="text"
                value={formData.endTime}
                onChange={handleChange}
                disabled={isLoading}
              />
              <FieldError>{formErrors.endTime}</FieldError>
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Social images</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="mainImageName">Name on main image</FieldLabel>
              <Input
                id="mainImageName"
                name="mainImageName"
                type="text"
                value={formData.mainImageName}
                onChange={handleChange}
                disabled={isLoading}
              />
              <FieldError>{formErrors.mainImageName}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="individualImageName">Name on event image</FieldLabel>
              <FieldDescription>This needs to be three lines</FieldDescription>
              <Textarea
                id="individualImageName"
                name="individualImageName"
                rows={INDIVIDUAL_IMAGE_NAME_LINE_COUNT}
                value={formData.individualImageName}
                onChange={handleChange}
                disabled={isLoading}
              />
              <FieldError>{formErrors.individualImageName}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="backgroundImagePath">Background image path</FieldLabel>
              <Input
                id="backgroundImagePath"
                name="backgroundImagePath"
                type="text"
                value={formData.backgroundImagePath}
                onChange={handleChange}
                disabled={isLoading}
              />
              <FieldError>{formErrors.backgroundImagePath}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="color">Event image header color</FieldLabel>
              <Input
                id="color"
                name="color"
                type="text"
                value={formData.color}
                onChange={handleChange}
                disabled={isLoading}
              />
              <FieldError>{formErrors.color}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="description">Description</FieldLabel>
              <Textarea
                id="description"
                name="description"
                rows={2}
                value={formData.description}
                onChange={handleChange}
                disabled={isLoading}
              />
              <FieldError>{formErrors.description}</FieldError>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <FormActions>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Spinner /> {submitLoadingLabel}
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </FormActions>
    </form>
  )
}
