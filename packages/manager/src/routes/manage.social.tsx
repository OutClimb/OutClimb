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
import { MapPin } from 'lucide-react'
import permissionGuard from '@/lib/permission-guard'
import type React from 'react'
import { Spinner } from '@/components/ui/spinner'
import { UnauthorizedError } from '@/errors/unauthorized'
import { useEffect, useMemo, useState } from 'react'
import useLocationStore from '@/stores/location'
import useUserStore, { READ_PERMISSION } from '@/stores/user'

export const Route = createFileRoute('/manage/social')({
  component: Social,
  head: () => ({
    meta: [
      {
        title: 'Social Images | OutClimb Management',
      },
    ],
  }),
  beforeLoad: ({ context, location }) =>
    Promise.all([authGuard(context, location), permissionGuard(context, 'social', READ_PERMISSION)]),
})

function Social() {
  const navigate = useNavigate()
  const { token } = useUserStore()
  const { data, isEmpty, populate } = useLocationStore()

  const [isHydrated, setIsHydrated] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [formData, setFormData] = useState<SocialImageFieldData>({
    month: new Date().getMonth() == 11 ? 0 : new Date().getMonth() + 1,
    year: new Date().getMonth() == 11 ? new Date().getFullYear() + 1 : new Date().getFullYear(),
    numberOfEvents: 0,
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

  if (formData.events.length != formData.numberOfEvents) {
    setFormData({
      ...formData,
      events: [...Array(formData.numberOfEvents).keys()].map<EventSocialImageFormData>(() => {
        return {
          day: undefined,
          startTime: '',
          endTime: '',
          location: 0,
          address: '',
          description: '',
        }
      }),
    })
  }

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
      <Header>Social Images</Header>

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
              numberOfEvents={formData.numberOfEvents}
              disabled={isLoading || isGenerating}
              onChange={handleGeneralFieldChange}
            />
            {formData.events.map((event, index) => {
              return (
                <EventSocialImageFields
                  year={formData.year}
                  month={formData.month}
                  locations={sortedLocationList}
                  eventNumber={index + 1}
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
              )
            })}

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
    </>
  )
}
