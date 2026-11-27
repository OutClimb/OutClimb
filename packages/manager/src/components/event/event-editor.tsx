'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fetchAssets } from '@/api/asset'
import { fetchEventTags } from '@/api/event'
import { fetchLocations } from '@/api/location'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { FormActions } from '@/components/form-actions'
import { applyLocationTimesToEvent, applyLocationToEvent } from '@/lib/event'
import { hasEventLinkErrors, normalizeEventLink, validateEventLink } from '@/lib/event-link'
import type { EventLinkErrors } from '@/lib/event-link'
import { slugify } from '@/lib/slug'
import { formatInTimezone, parseInTimezone } from '@/lib/timezone'
import { Input } from '@/components/ui/input'
import { LinkInput } from './link-input'
import { MarkdownEditor } from '@/components/markdown-editor'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { TagInput } from './tag-input'
import { Textarea } from '@/components/ui/textarea'
import { UnauthorizedError } from '@/errors/unauthorized'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import useAssetStore from '@/stores/asset'
import useLocationStore from '@/stores/location'
import useSelfStore from '@/stores/self'
import type { Event, EventLink, EventRequest } from '@/types/event'

const REQUIRED_FIELD_MESSAGE = 'Please fill in this field'
const END_BEFORE_START_MESSAGE = 'End must be after the start'
const SAVE_FAILED_MESSAGE = 'An error occurred while saving the event. Please try again.'
const NO_LOCATION_VALUE = 'none'
const DATE_FORMAT = 'yyyy-MM-dd'
const DATETIME_LOCAL_FORMAT = "yyyy-MM-dd'T'HH:mm"
const IMAGE_FILE_NAME_PATTERN = /\.(jpe?g|png|svg|webp)$/i

interface EditorData {
  title: string
  slug: string
  startsAt: string
  endsAt: string
  locationId: string
  locationName: string
  address: string
  city: string
  state: string
  zip: string
  featuredImageAssetId: string
  featuredImageAltText: string
  excerpt: string
  body: string
  tags: Array<string>
  links: Array<EventLink>
}

type EditorTextField = Exclude<keyof EditorData, 'tags' | 'links'>

type EditorErrors = Record<Exclude<keyof EditorData, 'links'>, string>

const emptyData: EditorData = {
  title: '',
  slug: '',
  startsAt: '',
  endsAt: '',
  locationId: NO_LOCATION_VALUE,
  locationName: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  featuredImageAssetId: '',
  featuredImageAltText: '',
  excerpt: '',
  body: '',
  tags: [],
  links: [],
}

const emptyErrors: EditorErrors = {
  title: '',
  slug: '',
  startsAt: '',
  endsAt: '',
  locationId: '',
  locationName: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  featuredImageAssetId: '',
  featuredImageAltText: '',
  excerpt: '',
  body: '',
  tags: '',
}

const requiredTextFields: Array<EditorTextField> = [
  'title',
  'slug',
  'startsAt',
  'endsAt',
  'locationName',
  'address',
  'city',
  'state',
  'zip',
  'featuredImageAssetId',
  'featuredImageAltText',
  'excerpt',
  'body',
]

function formatForDateTimeInput(isoString: string): string {
  return formatInTimezone(new Date(isoString).getTime(), DATETIME_LOCAL_FORMAT)
}

function dataFromEvent(event: Event): EditorData {
  return {
    title: event.title,
    slug: event.slug,
    startsAt: formatForDateTimeInput(event.startsAt),
    endsAt: formatForDateTimeInput(event.endsAt),
    locationId: event.locationId === null ? NO_LOCATION_VALUE : String(event.locationId),
    locationName: event.locationName,
    address: event.address,
    city: event.city,
    state: event.state,
    zip: event.zip,
    featuredImageAssetId: String(event.featuredImage.assetId),
    featuredImageAltText: event.featuredImage.altText,
    excerpt: event.excerpt,
    body: event.body,
    tags: event.tags,
    links: event.links,
  }
}

function validate(data: EditorData): EditorErrors {
  const errors = { ...emptyErrors }

  for (const key of requiredTextFields) {
    if (!data[key].trim()) {
      errors[key] = REQUIRED_FIELD_MESSAGE
    }
  }

  const startsAtMs = parseInTimezone(data.startsAt)
  const endsAtMs = parseInTimezone(data.endsAt)
  if (startsAtMs !== null && endsAtMs !== null && endsAtMs <= startsAtMs) {
    errors.endsAt = END_BEFORE_START_MESSAGE
  }

  return errors
}

function buildRequest(data: EditorData): EventRequest {
  return {
    title: data.title.trim(),
    slug: data.slug.trim(),
    startsAt: new Date(parseInTimezone(data.startsAt) ?? 0).toISOString(),
    endsAt: new Date(parseInTimezone(data.endsAt) ?? 0).toISOString(),
    locationId: data.locationId === NO_LOCATION_VALUE ? null : Number(data.locationId),
    locationName: data.locationName.trim(),
    address: data.address.trim(),
    city: data.city.trim(),
    state: data.state.trim(),
    zip: data.zip.trim(),
    featuredImageAssetId: Number(data.featuredImageAssetId),
    featuredImageAltText: data.featuredImageAltText.trim(),
    excerpt: data.excerpt.trim(),
    body: data.body.trim(),
    tags: data.tags,
    links: data.links.map(normalizeEventLink),
  }
}

interface EventEditorProps {
  initialEvent?: Event
  onSave: (request: EventRequest) => Promise<void>
  submitLabel: string
  submitLoadingLabel: string
}

export function EventEditor({ initialEvent, onSave, submitLabel, submitLoadingLabel }: EventEditorProps) {
  const navigate = useNavigate()
  const { token } = useSelfStore()
  const { data: locationsById, populate: populateLocations } = useLocationStore()
  const { data: assetsById, populate: populateAssets } = useAssetStore()

  const [isLoading, setIsLoading] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [formData, setFormData] = useState<EditorData>(() => (initialEvent ? dataFromEvent(initialEvent) : emptyData))
  const [formErrors, setFormErrors] = useState<EditorErrors>(emptyErrors)
  const [linkErrors, setLinkErrors] = useState<Array<EventLinkErrors>>([])
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(Boolean(initialEvent))
  const [tagSuggestions, setTagSuggestions] = useState<Array<string>>([])

  const locations = useMemo(() => Object.values(locationsById), [locationsById])
  const imageAssets = useMemo(
    () => Object.values(assetsById).filter((asset) => IMAGE_FILE_NAME_PATTERN.test(asset.fileName)),
    [assetsById],
  )

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [fetchedLocations, fetchedAssets, fetchedTags] = await Promise.all([
          fetchLocations(token ?? ''),
          fetchAssets(token ?? ''),
          fetchEventTags(token ?? ''),
        ])
        populateLocations(fetchedLocations)
        populateAssets(fetchedAssets)
        setTagSuggestions(fetchedTags)
      } catch (error) {
        if (error instanceof UnauthorizedError) {
          navigate({ to: '/manage/login' })
        }
      }
    }
    loadOptions()
  }, [token, populateLocations, populateAssets, navigate])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target
      setFormData((prev) => {
        const next = { ...prev, [name]: value }
        const isDateField = name === 'startsAt' || name === 'endsAt'
        const linkedLocation = locationsById[Number(prev.locationId)]
        return isDateField ? applyLocationTimesToEvent(next, linkedLocation, linkedLocation) : next
      })
    },
    [locationsById],
  )

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const title = e.target.value
      setFormData((prev) => ({ ...prev, title, slug: isSlugManuallyEdited ? prev.slug : slugify(title) }))
    },
    [isSlugManuallyEdited],
  )

  const handleBodyChange = useCallback((body: string) => {
    setFormData((prev) => ({ ...prev, body }))
  }, [])

  const handleSlugChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const slug = e.target.value
    setFormData((prev) => ({ ...prev, slug }))
    setIsSlugManuallyEdited(true)
  }, [])

  const handleLocationChange = useCallback(
    (value: string) => {
      setFormData((prev) => {
        const previousLocation = locationsById[Number(prev.locationId)]
        const newLocation = locationsById[Number(value)]
        return {
          ...applyLocationToEvent(prev, previousLocation, newLocation, formatInTimezone(Date.now(), DATE_FORMAT)),
          locationId: value,
        }
      })
    },
    [locationsById],
  )

  const handleTagsChange = useCallback((tags: Array<string>) => {
    setFormData((prev) => ({ ...prev, tags }))
  }, [])

  const handleLinksChange = useCallback((links: Array<EventLink>) => {
    setFormData((prev) => ({ ...prev, links }))
    setLinkErrors([])
  }, [])

  const handleFeaturedImageChange = useCallback((value: string) => {
    setFormData((prev) => ({ ...prev, featuredImageAssetId: value }))
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()

      const errors = validate(formData)
      const nextLinkErrors = formData.links.map(validateEventLink)
      setFormErrors(errors)
      setLinkErrors(nextLinkErrors)
      if (Object.values(errors).some(Boolean) || hasEventLinkErrors(nextLinkErrors)) return

      setIsLoading(true)
      setSaveError('')
      try {
        await onSave(buildRequest(formData))
      } catch {
        setSaveError(SAVE_FAILED_MESSAGE)
      } finally {
        setIsLoading(false)
      }
    },
    [formData, onSave],
  )

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      {saveError && (
        <Alert variant="destructive">
          <AlertDescription>{saveError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="locationId">Event location</FieldLabel>
              <Select value={formData.locationId} onValueChange={handleLocationChange} disabled={isLoading}>
                <SelectTrigger id="locationId" className="w-full">
                  <SelectValue placeholder="Select a location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_LOCATION_VALUE}>No location</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={String(location.id)}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="title">Title</FieldLabel>
              <Input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleTitleChange}
                disabled={isLoading}
              />
              <FieldError>{formErrors.title}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="slug">Slug</FieldLabel>
              <Input
                id="slug"
                name="slug"
                type="text"
                value={formData.slug}
                onChange={handleSlugChange}
                disabled={isLoading}
              />
              <FieldError>{formErrors.slug}</FieldError>
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="startsAt">Starts (Central Time)</FieldLabel>
                <Input
                  id="startsAt"
                  name="startsAt"
                  type="datetime-local"
                  value={formData.startsAt}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                <FieldError>{formErrors.startsAt}</FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor="endsAt">Ends (Central Time)</FieldLabel>
                <Input
                  id="endsAt"
                  name="endsAt"
                  type="datetime-local"
                  value={formData.endsAt}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                <FieldError>{formErrors.endsAt}</FieldError>
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="excerpt">Excerpt</FieldLabel>
              <Textarea
                id="excerpt"
                name="excerpt"
                rows={2}
                value={formData.excerpt}
                onChange={handleChange}
                disabled={isLoading}
              />
              <FieldError>{formErrors.excerpt}</FieldError>
            </Field>
            <Field>
              <FieldLabel>Body</FieldLabel>
              <MarkdownEditor
                variant="events"
                markdown={formData.body}
                onChange={handleBodyChange}
                disabled={isLoading}
              />
              <FieldError>{formErrors.body}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="tags">Tags</FieldLabel>
              <FieldDescription>Press Enter or comma to add a tag, such as bouldering, rope, or free</FieldDescription>
              <TagInput
                id="tags"
                tags={formData.tags}
                suggestions={tagSuggestions}
                onChange={handleTagsChange}
                disabled={isLoading}
              />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Links</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldDescription>
                External pages for this event, such as a registration form or the gym&apos;s event page
              </FieldDescription>
              <LinkInput
                id="links"
                links={formData.links}
                errors={linkErrors}
                onChange={handleLinksChange}
                disabled={isLoading}
              />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Location</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="locationName">Name</FieldLabel>
              <Input
                id="locationName"
                name="locationName"
                type="text"
                value={formData.locationName}
                onChange={handleChange}
                disabled={isLoading}
              />
              <FieldError>{formErrors.locationName}</FieldError>
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
          <CardTitle>Featured Image</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="featuredImageAssetId">Image</FieldLabel>
              <FieldDescription>Upload images on the Assets page first</FieldDescription>
              <Select
                value={formData.featuredImageAssetId}
                onValueChange={handleFeaturedImageChange}
                disabled={isLoading}>
                <SelectTrigger id="featuredImageAssetId" className="w-full">
                  <SelectValue placeholder="Select an image" />
                </SelectTrigger>
                <SelectContent>
                  {imageAssets.map((asset) => (
                    <SelectItem key={asset.id} value={String(asset.id)}>
                      {asset.fileName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError>{formErrors.featuredImageAssetId}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="featuredImageAltText">Alt text</FieldLabel>
              <FieldDescription>Describes the image for screen readers and the RSS feed</FieldDescription>
              <Input
                id="featuredImageAltText"
                name="featuredImageAltText"
                type="text"
                value={formData.featuredImageAltText}
                onChange={handleChange}
                disabled={isLoading}
              />
              <FieldError>{formErrors.featuredImageAltText}</FieldError>
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
