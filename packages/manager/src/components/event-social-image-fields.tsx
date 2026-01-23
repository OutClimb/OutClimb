'use client'

import { Button } from '@/components/ui/button'
import { Calendar } from './ui/calendar'
import { CalendarIcon } from 'lucide-react'
import { CardContent } from '@/components/ui/card'
import { Field, FieldLabel } from './ui/field'
import { format } from 'date-fns'
import { Input } from './ui/input'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import type React from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { useCallback } from 'react'
import type { EventSocialImageFormData } from '@/types/social-image'
import { Textarea } from './ui/textarea'

export interface EventSocialImageFieldsProps {
  year: number
  month: number
  eventNumber: number
  day?: Date
  startTime: string
  endTime: string
  location: string
  address: string
  description: string
  onChange: (data: EventSocialImageFormData) => void
}

const DEFAULT_ADDRESSES: Record<string, string> = {
  BIB: '161 Cheshire Ln # 500\nPlymouth, MN 55441',
  MBP: '1433 West River Rd N\nMinneapolis, MN 55411',
  MNCC: '1620 Central Ave NE #178\nMinneapolis, MN 55413',
  SPBP: '42 W Water St\nSt Paul, MN 55107',
  TCB: '2550 Wabash Ave\nSt Paul, MN 55114',
  VEB: '9601 James Ave S\nBloomington, MN 55431',
  VEM: '2540 Nicollet Ave\nMinneapolis, MN 55404',
  VESP: '855 Phalen Blvd\nSt Paul, MN 55106',
}

const DEFAULT_TIMES: Record<string, { startTime: string; endTime: string }> = {
  BIB: {
    startTime: '7:00 PM',
    endTime: '9:00 PM',
  },
  MBP: {
    startTime: '7:00 PM',
    endTime: '9:00 PM',
  },
  MNCC: {
    startTime: '6:00 PM',
    endTime: '9:00 PM',
  },
  SPBP: {
    startTime: '7:00 PM',
    endTime: '9:00 PM',
  },
  TCB: {
    startTime: '6:00 PM',
    endTime: '8:00 PM',
  },
  VEB: {
    startTime: '6:00 PM',
    endTime: '8:00 PM',
  },
  VEM: {
    startTime: '6:00 PM',
    endTime: '8:00 PM',
  },
  VESP: {
    startTime: '6:00 PM',
    endTime: '8:00 PM',
  },
}

const DEFAULT_DESCRIPTIONS: Record<string, string> = {
  BIB: 'All events are FREE to gym members.\n\nWe do not have any specific discounts, but day passes are buy one get\none free on Tuesdays. Rentals are not included and are $5 (+tax) for\nshoes.\n\nVisit OutClimb.gay for more information.',
  MBP: 'All events are FREE to gym members.\n\nFree day pass for your first time attending an OutClimb event at MBP.\n\nFree day pass to individuals that align with both BIPOC and\nqueer/trans identities, just tell the front desk you would like a\nQTBIPOC pass.\n\nDiscounted day passes ($12+Tax) for all other returning climbers,\nwhich includes shoes rentals.\n\nVisit OutClimb.gay for more information.',
  MNCC: 'Free open-climbing for LGBTQ+ identifying folks.\n\nFree snacks and non-alcoholic beverages are provided.\n\nBecause space is limited, registration is required. Visit OutClimb.gay\nfor more information.',
  SPBP: 'All events are FREE to gym members.\n\nFree day pass for your first time attending an OutClimb event at SPBP.\n\nFree day pass to individuals that align with both BIPOC and\nqueer/trans identities, just tell the front desk you would like a\nQTBIPOC pass.\n\nDiscounted day passes ($12+Tax) for all other returning climbers,\nwhich includes shoes rentals.\n\nVisit OutClimb.gay for more information.',
  TCB: 'All events are FREE to gym members.\n\nFree day pass to Vertical Endeavors for your first time attending an\nOutClimb event.\n\nDiscounted day passes ($15+Tax) for returning climbers, which \nincludes shoes rentals.\n\nVisit OutClimb.gay for more information.',
  VEB: 'All events are FREE to gym members.\n\nFree day pass to Vertical Endeavors for your first time attending an\nOutClimb event.\n\nDiscounted day passes ($15+Tax) for returning climbers, which \nincludes shoes and harness rentals.\n\nVisit OutClimb.gay for more information.',
  VEM: 'All events are FREE to gym members.\n\nFree day pass to Vertical Endeavors for your first time attending an\nOutClimb event.\n\nDiscounted day passes ($15+Tax) for returning climbers, which \nincludes shoes and harness rentals.\n\nVisit OutClimb.gay for more information.',
  VESP: 'All events are FREE to gym members.\n\nFree day pass to Vertical Endeavors for your first time attending an\nOutClimb event.\n\nDiscounted day passes ($15+Tax) for returning climbers, which \nincludes shoes and harness rentals.\n\nVisit OutClimb.gay for more information.',
}

export function EventSocialImageFields({
  year,
  month,
  eventNumber,
  location,
  address,
  day,
  startTime,
  endTime,
  description,
  onChange,
}: EventSocialImageFieldsProps) {
  const handleLocationChange = useCallback(
    (value: string) => {
      let newAddress = address
      if (address === '' || address === DEFAULT_ADDRESSES[location]) {
        newAddress = DEFAULT_ADDRESSES[value]
      }

      let newStartTime = startTime
      let newEndTime = endTime
      if (
        (startTime === '' && endTime === '') ||
        (startTime === DEFAULT_TIMES[location]?.startTime && endTime === DEFAULT_TIMES[location]?.endTime)
      ) {
        newStartTime = DEFAULT_TIMES[value].startTime
        newEndTime = DEFAULT_TIMES[value].endTime
      }

      let newDescription = description
      if (description === '' || description === DEFAULT_DESCRIPTIONS[location]) {
        newDescription = DEFAULT_DESCRIPTIONS[value]
      }

      onChange({
        location: value,
        address: newAddress,
        day,
        startTime: newStartTime,
        endTime: newEndTime,
        description: newDescription,
      })
    },
    [onChange, day, startTime, endTime, location, address, description],
  )

  const handleAddressChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const { value } = e.target
      onChange({
        location,
        address: value,
        day,
        startTime,
        endTime,
        description,
      })
    },
    [onChange, day, startTime, endTime, location, description],
  )

  const handleDayChange = useCallback(
    (value: Date) => {
      onChange({
        location,
        address,
        day: value,
        startTime,
        endTime,
        description,
      })
    },
    [onChange, location, address, startTime, endTime, description],
  )

  const handleStartTimeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = e.target
      onChange({
        location,
        address,
        day,
        startTime: value,
        endTime,
        description,
      })
    },
    [onChange, location, address, day, endTime, description],
  )

  const handleEndTimeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = e.target
      onChange({
        location,
        address,
        day,
        startTime,
        endTime: value,
        description,
      })
    },
    [onChange, location, address, day, startTime, description],
  )

  return (
    <CardContent className="border-t">
      <h3 className="my-4 font-bold text-xl">Event #{eventNumber}</h3>

      <div className="mb-4">
        <Field>
          <FieldLabel>Location</FieldLabel>
          <Select value={location} onValueChange={handleLocationChange} required>
            <SelectTrigger>
              <SelectValue placeholder="Select the location for the event" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BIB">Big Island Bouldering</SelectItem>
              <SelectItem value="MBP">Minneapolis Bouldering Project</SelectItem>
              <SelectItem value="MNCC">Minnesota Climbing Cooperative</SelectItem>
              <SelectItem value="SPBP">Saint Paul Bouldering Project</SelectItem>
              <SelectItem value="TCB">Twin Cities Bouldering</SelectItem>
              <SelectItem value="VEB">Vertical Endeavors - Bloomington</SelectItem>
              <SelectItem value="VEM">Vertical Endeavors - Minneapolis</SelectItem>
              <SelectItem value="VESP">Vertical Endeavors - Saint Paul</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div className="mb-4">
        <Field>
          <FieldLabel>Address</FieldLabel>
          <Textarea value={address} name="address" rows={2} onChange={handleAddressChange} required />
        </Field>
      </div>

      <div className="mb-4">
        <Field>
          <FieldLabel>Date</FieldLabel>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                data-empty={!day}
                className="data-[empty=true]:text-muted-foreground w-70 justify-start text-left font-normal">
                <CalendarIcon />
                {day ? format(day, 'PPP') : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                animate
                mode="single"
                disabled={{ before: new Date(year, month, 1), after: new Date(year, month + 1, 0) }}
                timeZone="America/Chicago"
                month={new Date(year, month)}
                selected={day}
                onSelect={handleDayChange}
                required
              />
            </PopoverContent>
          </Popover>
        </Field>
      </div>

      <div className="flex mb-4 gap-4">
        <Field>
          <FieldLabel>Start Time</FieldLabel>
          <Input name="startTime" type="text" value={startTime} onChange={handleStartTimeChange} required />
        </Field>

        <Field>
          <FieldLabel>End Time</FieldLabel>
          <Input name="startTime" type="text" value={endTime} onChange={handleEndTimeChange} required />
        </Field>
      </div>

      <div className="mb-4">
        <Field>
          <FieldLabel>Description</FieldLabel>
          <Textarea value={description} name="description" rows={12} onChange={handleAddressChange} required />
        </Field>
      </div>
    </CardContent>
  )
}
