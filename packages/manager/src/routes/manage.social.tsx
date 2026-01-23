'use client'

import authGuard from '@/lib/auth-guard'
import { Button } from '@/components/ui/button'
import { Card, CardFooter } from '@/components/ui/card'
import { createFileRoute } from '@tanstack/react-router'
import type { EventSocialImageFormData, GeneralSocialImageFormData, SocialImageFieldData } from '@/types/social-image'
import { Header } from '@/components/header'
import type React from 'react'
import { useRef, useState } from 'react'
import { GeneralSocialImageFields } from '@/components/general-social-image-fields'
import { EventSocialImageFields } from '@/components/event-social-image-fields'

export const Route = createFileRoute('/manage/social')({
  component: Social,
  head: () => ({
    meta: [
      {
        title: 'Social Images | OutClimb Management',
      },
    ],
  }),
  beforeLoad: ({ context, location }) => authGuard(context, location),
})

function Social() {
  const canvas = useRef(null)
  const [formData, setFormData] = useState<SocialImageFieldData>({
    month: new Date().getMonth() == 11 ? 0 : new Date().getMonth() + 1,
    year: new Date().getMonth() == 11 ? new Date().getFullYear() + 1 : new Date().getFullYear(),
    numberOfEvents: 0,
    events: [],
  })

  if (formData.events.length != formData.numberOfEvents) {
    setFormData({
      ...formData,
      events: [...Array(formData.numberOfEvents).keys()].map<EventSocialImageFormData>(() => {
        return {
          day: undefined,
          startTime: '',
          endTime: '',
          location: '',
          address: '',
          description: '',
        }
      }),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
        <form onSubmit={handleSubmit}>
          <GeneralSocialImageFields
            month={formData.month}
            year={formData.year}
            numberOfEvents={formData.numberOfEvents}
            onChange={handleGeneralFieldChange}
          />
          {formData.events.map((event, index) => {
            return (
              <EventSocialImageFields
                year={formData.year}
                month={formData.month}
                eventNumber={index + 1}
                day={event.day}
                startTime={event.startTime}
                endTime={event.endTime}
                location={event.location}
                address={event.address}
                description={event.description}
                onChange={(data) => {
                  handleEventFieldChange(index, data)
                }}
              />
            )
          })}

          <CardFooter>
            <Button className="px-6" type="submit">
              Generate
            </Button>
          </CardFooter>
        </form>
      </Card>

      <canvas className="hidden" ref={canvas}></canvas>
    </>
  )
}
