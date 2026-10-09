'use client'

import authGuard from '@/lib/auth-guard'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { CalendarIcon, Download, MapPin } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Content } from '@/components/content'
import { FormActions } from '@/components/form-actions'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { fetchLocations } from '@/api/location'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { format } from 'date-fns'
import { Header } from '@/components/header'
import { Input } from '@/components/ui/input'
import permissionGuard from '@/lib/permission-guard'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { QtbipocSocialImageFormData } from '@/types/social-image'
import type React from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { UnauthorizedError } from '@/errors/unauthorized'
import { useCallback, useEffect, useMemo, useState } from 'react'
import useLocationStore from '@/stores/location'
import useSelfStore, { READ_PERMISSION } from '@/stores/self'
import { generateQtbipocSocialImage } from '@/lib/social-image'

export const Route = createFileRoute('/manage_/social-images/qtbipoc')({
  component: QTBIPOC,
  head: () => ({
    meta: [
      {
        title: 'QTBIPOC Event Image | OutClimb Management',
      },
    ],
  }),
  beforeLoad: ({ context, location }) =>
    Promise.all([authGuard(context, location), permissionGuard(context, 'social', READ_PERMISSION)]),
})

function QTBIPOC() {
  const navigate = useNavigate()
  const { token } = useSelfStore()
  const { data, isEmpty, populate } = useLocationStore()

  const [isHydrated, setIsHydrated] = useState<boolean>(false)
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [formData, setFormData] = useState<QtbipocSocialImageFormData>({
    day: new Date(),
    startTime: '7pm',
    endTime: '9pm',
    whenDescription: '(4th Thursday of every month)',
    location: undefined,
    cost: 'Free\nMention “QTBIPOC Meetup”\nwhen you check in',
  })

  useEffect(() => {
    const fetchLocationsFromApi = async () => {
      setIsLoading(true)

      try {
        const locations = await fetchLocations(token || '')
        populate(locations)
      } catch (error) {
        if (error instanceof UnauthorizedError) {
          navigate({ to: '/manage/login' })
        } else {
          // Display error
        }
      } finally {
        setIsHydrated(true)
        setIsLoading(false)
      }
    }

    if (!isHydrated) {
      fetchLocationsFromApi()
    }
  })

  const sortedLocationList = useMemo(() => {
    return Object.values(data).sort((a, b) => {
      if (a.name.toUpperCase() < b.name.toUpperCase()) {
        return -1
      }

      if (a.name.toUpperCase() > b.name.toUpperCase()) {
        return 1
      }

      return 0
    })
  }, [data])

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true)
    await generateQtbipocSocialImage(formData, sortedLocationList)
    setIsGenerating(false)
  }, [formData, setIsGenerating, sortedLocationList])

  const handleDayChange = useCallback(
    (value: Date) => {
      setFormData((prev) => ({
        ...prev,
        day: value,
      }))
    },
    [setFormData],
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        [e.target.name]: e.target.value,
      }))
    },
    [setFormData],
  )

  const handleLocationChange = useCallback(
    (value: string) => {
      setFormData((prev) => ({
        ...prev,
        location: parseInt(value, 10),
      }))
    },
    [setFormData],
  )

  const handleTextareChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setFormData((prev) => ({
        ...prev,
        [e.target.name]: e.target.value,
      }))
    },
    [setFormData],
  )

  return (
    <>
      <Header isLoading={isLoading || isGenerating} backTo="/manage/social-images">
        QTBIPOC Event Image
      </Header>

      <Content>
        {(isLoading || isEmpty()) && (
          <Card className="p-0">
            {isLoading && (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Spinner />
                  </EmptyMedia>
                  <EmptyTitle>Loading locations...</EmptyTitle>
                </EmptyHeader>
              </Empty>
            )}

            {!isLoading && isEmpty() && (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <MapPin />
                  </EmptyMedia>
                  <EmptyTitle>No event locations added yet</EmptyTitle>
                  <EmptyDescription>Add some event locations before generating social images.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </Card>
        )}

        {!isLoading && !isEmpty() && (
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>When</CardTitle>
                <CardDescription>The date and time of the event</CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <div className="grid gap-5 sm:grid-cols-3">
                    <Field>
                      <FieldLabel>Date</FieldLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            data-empty={!formData.day}
                            disabled={isGenerating}
                            className="w-full justify-start text-left font-normal data-[empty=true]:text-muted-foreground">
                            <CalendarIcon />
                            {formData.day ? format(formData.day, 'PPP') : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            timeZone="America/Chicago"
                            selected={formData.day}
                            onSelect={handleDayChange}
                            defaultMonth={formData.day}
                            required
                          />
                        </PopoverContent>
                      </Popover>
                    </Field>
                    <Field>
                      <FieldLabel>Start Time</FieldLabel>
                      <Input
                        name="startTime"
                        type="text"
                        value={formData.startTime}
                        disabled={isGenerating}
                        onChange={handleInputChange}
                        required
                      />
                    </Field>
                    <Field>
                      <FieldLabel>End Time</FieldLabel>
                      <Input
                        name="endTime"
                        type="text"
                        value={formData.endTime}
                        disabled={isGenerating}
                        onChange={handleInputChange}
                        required
                      />
                    </Field>
                  </div>
                  <Field>
                    <FieldLabel>Additional Details</FieldLabel>
                    <Input
                      name="whenDescription"
                      type="text"
                      value={formData.whenDescription}
                      disabled={isGenerating}
                      onChange={handleInputChange}
                      required
                    />
                  </Field>
                </FieldGroup>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Where</CardTitle>
                <CardDescription>Where the event takes place</CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <Field>
                    <FieldLabel>Location</FieldLabel>
                    <Select
                      value={formData.location?.toString()}
                      disabled={isGenerating}
                      onValueChange={handleLocationChange}
                      required>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select the location for the event" />
                      </SelectTrigger>
                      <SelectContent>
                        {sortedLocationList.map((location) => (
                          <SelectItem key={location.id} value={location.id.toString()}>
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
                <CardTitle>Cost</CardTitle>
                <CardDescription>How much it costs to attend</CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <Field>
                    <FieldLabel>Cost</FieldLabel>
                    <Textarea
                      value={formData.cost}
                      name="cost"
                      rows={3}
                      disabled={isGenerating}
                      onChange={handleTextareChange}
                      required
                    />
                  </Field>
                </FieldGroup>
              </CardContent>
            </Card>
            <FormActions>
              <Button type="button" disabled={isGenerating} onClick={handleGenerate}>
                {isGenerating ? (
                  <>
                    <Spinner /> Generating...
                  </>
                ) : (
                  <>
                    <Download /> Generate
                  </>
                )}
              </Button>
            </FormActions>
          </div>
        )}
      </Content>
    </>
  )
}
