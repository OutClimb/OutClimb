'use client'

import authGuard from '@/lib/auth-guard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { EventSocialImageFields } from '@/components/social/event-social-image-fields'
import type { EventSocialImageFormData, GeneralSocialImageFormData, SocialImageFieldData } from '@/types/social-image'
import { fetchLocations } from '@/api/location'
import { GeneralSocialImageFields } from '@/components/social/general-social-image-fields'
import { generateSocialImages } from '@/lib/social-image'
import { Header } from '@/components/header'
import { MapPin, Plus } from 'lucide-react'
import permissionGuard from '@/lib/permission-guard'
import type React from 'react'
import { Spinner } from '@/components/ui/spinner'
import { UnauthorizedError } from '@/errors/unauthorized'
import { useCallback, useEffect, useMemo, useState } from 'react'
import useLocationStore from '@/stores/location'
import useSelfStore, { READ_PERMISSION } from '@/stores/self'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Content } from '@/components/content'

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

      const newFormData = { ...prev }
      newFormData.events.push({
        day: undefined,
        startTime: '',
        endTime: '',
        location: 0,
        address: '',
        description: '',
      })

      return newFormData
    })
  }, [setFormData])

  const handleDelete = useCallback(
    (index: number) => {
      setFormData((prev) => {
        const newFormData = { ...prev }
        newFormData.events.splice(index, 1)

        return newFormData
      })
    },
    [setFormData],
  )

  const handleSubmit = async (e: React.FormEvent) => {
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
      <Header
        actions={
          <Button onClick={handleAdd} disabled={isLoading || formData.events.length === 7}>
            <Plus />
            Add Event
          </Button>
        }>
        Monthly Event Images
      </Header>

      <Content>
        <Card>
          {isLoading && (
            <CardContent className="p-0">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Spinner />
                  </EmptyMedia>
                  <EmptyTitle>Loading locations...</EmptyTitle>
                </EmptyHeader>
              </Empty>
            </CardContent>
          )}

          {!isLoading && isEmpty() && (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <MapPin />
                </EmptyMedia>
                <EmptyTitle>No event locations added yet, please add some before generating social images.</EmptyTitle>
              </EmptyHeader>
            </Empty>
          )}

          {!isLoading && !isEmpty() && (
            <form onSubmit={handleSubmit}>
              <GeneralSocialImageFields
                month={formData.month}
                year={formData.year}
                disabled={isLoading || isGenerating}
                onChange={handleGeneralFieldChange}
              />
              {formData.events.length > 0 && (
                <Accordion type="multiple" className="border-t">
                  {formData.events.map((event, index) => {
                    return (
                      <AccordionItem key={index} value={index.toString()}>
                        <AccordionTrigger className="px-4">
                          Event #{index + 1}
                          {event.location != 0 &&
                            ` - ${sortedLocationList.find((loc) => loc.id === event.location)?.name}`}
                        </AccordionTrigger>
                        <AccordionContent>
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

                          <Button
                            className="mx-4 w-full"
                            variant="destructive"
                            type="button"
                            onClick={() => handleDelete(index)}>
                            Delete Event #{index + 1}
                          </Button>
                        </AccordionContent>
                      </AccordionItem>
                    )
                  })}
                </Accordion>
              )}

              <CardFooter>
                <Button className="px-6" type="submit" disabled={isLoading || isGenerating}>
                  {isGenerating && (
                    <>
                      <Spinner /> Generating...
                    </>
                  )}

                  {!isGenerating && <>Generate</>}
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </Content>
    </>
  )
}
