'use client'

import authGuard from '@/lib/auth-guard'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { EventSocialImageFields } from '@/components/social/event-social-image-fields'
import type { EventSocialImageFormData, GeneralSocialImageFormData, SocialImageFieldData } from '@/types/social-image'
import { fetchLocations } from '@/api/location'
import { GeneralSocialImageFields } from '@/components/social/general-social-image-fields'
import { generateSocialImages } from '@/lib/social-image'
import { Header } from '@/components/header'
import { Download, MapPin, Plus, Trash2 } from 'lucide-react'
import permissionGuard from '@/lib/permission-guard'
import type React from 'react'
import { Spinner } from '@/components/ui/spinner'
import { UnauthorizedError } from '@/errors/unauthorized'
import { useCallback, useEffect, useMemo, useState } from 'react'
import useLocationStore from '@/stores/location'
import useSelfStore, { READ_PERMISSION } from '@/stores/self'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Content } from '@/components/content'
import { FormActions } from '@/components/form-actions'

export const Route = createFileRoute('/manage_/social-images/monthly')({
  component: Monthly,
  head: () => ({
    meta: [
      {
        title: 'Monthly Event Images | OutClimb Management',
      },
    ],
  }),
  beforeLoad: ({ context, location }) =>
    Promise.all([authGuard(context, location), permissionGuard(context, 'social', READ_PERMISSION)]),
})

function Monthly() {
  const navigate = useNavigate()
  const { token } = useSelfStore()
  const { data, isEmpty, populate } = useLocationStore()

  const [isHydrated, setIsHydrated] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [formData, setFormData] = useState<SocialImageFieldData>({
    month: new Date().getMonth() == 11 ? 0 : new Date().getMonth() + 1,
    year: new Date().getMonth() == 11 ? new Date().getFullYear() + 1 : new Date().getFullYear(),
    events: [],
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

  const handleAdd = useCallback(() => {
    setFormData((prev) => {
      if (prev.events.length === 7) {
        return prev
      }

      return {
        ...prev,
        events: [
          ...prev.events,
          {
            day: undefined,
            startTime: '',
            endTime: '',
            location: 0,
            address: '',
            description: '',
          },
        ],
      }
    })
  }, [setFormData])

  const handleDelete = useCallback(
    (index: number) => {
      setFormData((prev) => ({
        ...prev,
        events: prev.events.filter((_, i) => i !== index),
      }))
    },
    [setFormData],
  )

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsGenerating(true)
    await generateSocialImages(formData, sortedLocationList)
    setIsGenerating(false)
  }

  const handleGeneralFieldChange = (data: GeneralSocialImageFormData) => {
    setFormData((prev) => ({
      ...prev,
      ...data,
    }))
  }

  const handleEventFieldChange = (index: number, data: EventSocialImageFormData) => {
    setFormData((prev) => {
      const newData = {
        ...prev,
        events: [...prev.events],
      }
      newData.events[index] = data
      return newData
    })
  }

  return (
    <>
      <Header isLoading={isLoading || isGenerating} backTo="/manage/social-images">
        Monthly Event Images
      </Header>

      <Content>
        {isLoading && (
          <Card className="p-0">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Spinner />
                </EmptyMedia>
                <EmptyTitle>Loading locations...</EmptyTitle>
              </EmptyHeader>
            </Empty>
          </Card>
        )}

        {!isLoading && isEmpty() && (
          <Card className="p-0">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <MapPin />
                </EmptyMedia>
                <EmptyTitle>No event locations added yet</EmptyTitle>
                <EmptyDescription>Add some event locations before generating social images.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </Card>
        )}

        {!isLoading && !isEmpty() && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Month</CardTitle>
                <CardDescription>The month these events take place in</CardDescription>
              </CardHeader>
              <CardContent>
                <GeneralSocialImageFields
                  month={formData.month}
                  year={formData.year}
                  disabled={isLoading || isGenerating}
                  onChange={handleGeneralFieldChange}
                />
              </CardContent>
            </Card>

            <Card className="pb-0">
              <CardHeader>
                <CardTitle>Events</CardTitle>
                <CardDescription>Each event gets its own image, up to 7</CardDescription>
                <CardAction>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAdd}
                    disabled={isGenerating || formData.events.length === 7}>
                    <Plus />
                    Add Event
                  </Button>
                </CardAction>
              </CardHeader>

              {formData.events.length === 0 ? (
                <CardContent className="pb-6">
                  <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                    No events yet. Use Add Event to start.
                  </div>
                </CardContent>
              ) : (
                <Accordion type="multiple" className="border-t">
                  {formData.events.map((event, index) => {
                    const locationName = sortedLocationList.find((loc) => loc.id === event.location)?.name

                    return (
                      <AccordionItem key={index} value={index.toString()}>
                        <AccordionTrigger className="rounded-none px-6 py-4 hover:bg-muted/40 hover:no-underline">
                          <span className="flex items-center gap-3">
                            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                              {index + 1}
                            </span>
                            <span className={locationName ? '' : 'text-muted-foreground'}>
                              {locationName ?? 'No location selected'}
                            </span>
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pt-2 pb-6">
                          <EventSocialImageFields
                            year={formData.year}
                            month={formData.month}
                            locations={sortedLocationList}
                            day={event.day}
                            startTime={event.startTime}
                            endTime={event.endTime}
                            location={event.location}
                            address={event.address}
                            description={event.description}
                            disabled={isLoading || isGenerating}
                            onChange={(data) => {
                              handleEventFieldChange(index, data)
                            }}
                          />

                          <div className="mt-5 flex justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              type="button"
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                              disabled={isGenerating}
                              onClick={() => handleDelete(index)}>
                              <Trash2 />
                              Remove Event
                            </Button>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    )
                  })}
                </Accordion>
              )}
            </Card>

            <FormActions>
              <Button type="submit" disabled={isLoading || isGenerating}>
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
          </form>
        )}
      </Content>
    </>
  )
}
