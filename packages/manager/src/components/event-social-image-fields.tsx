'use client'

import { Button } from '@/components/ui/button'
import { Calendar } from './ui/calendar'
import { CalendarIcon } from 'lucide-react'
import { CardContent } from '@/components/ui/card'
import type { EventSocialImageFormData } from '@/types/social-image'
import { Field, FieldLabel } from './ui/field'
import { format } from 'date-fns'
import { Input } from './ui/input'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import type React from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Textarea } from './ui/textarea'
import { useCallback } from 'react'
import type { Location } from '@/types/location'

export interface EventSocialImageFieldsProps {
  year: number
  month: number
  locations: Array<Location>
  eventNumber: number
  day?: Date
  startTime: string
  endTime: string
  location: number
  address: string
  description: string
  disabled: boolean
  onChange: (data: EventSocialImageFormData) => void
}

export function EventSocialImageFields({
  year,
  month,
  locations,
  eventNumber,
  location,
  address,
  day,
  startTime,
  endTime,
  description,
  disabled,
  onChange,
}: EventSocialImageFieldsProps) {
  const handleLocationChange = useCallback(
    (value: string) => {
      const locationId = parseInt(value, 10)
      const oldLocation = locations.find((loc) => loc.id === location)
      const newLocation = locations.find((loc) => loc.id === locationId)

      let newAddress = address
      if (address === '' || address === oldLocation?.address) {
        newAddress = newLocation?.address || ''
      }

      let newStartTime = startTime
      let newEndTime = endTime
      if (
        (startTime === '' && endTime === '') ||
        (startTime === oldLocation?.startTime && endTime === oldLocation?.endTime)
      ) {
        newStartTime = newLocation?.startTime || ''
        newEndTime = newLocation?.endTime || ''
      }

      let newDescription = description
      if (description === '' || description === oldLocation?.description) {
        newDescription = newLocation?.description || ''
      }

      onChange({
        location: locationId,
        address: newAddress,
        day,
        startTime: newStartTime,
        endTime: newEndTime,
        description: newDescription,
      })
    },
    [onChange, locations, day, startTime, endTime, location, address, description],
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
          <Select value={location.toString()} disabled={disabled} onValueChange={handleLocationChange} required>
            <SelectTrigger>
              <SelectValue placeholder="Select the location for the event" />
            </SelectTrigger>
            <SelectContent>
              {locations.map((location) => (
                <SelectItem key={location.id} value={location.id.toString()}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div className="mb-4">
        <Field>
          <FieldLabel>Address</FieldLabel>
          <Textarea
            value={address}
            name="address"
            rows={2}
            disabled={disabled}
            onChange={handleAddressChange}
            required
          />
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
                disabled={disabled}
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
          <Input
            name="startTime"
            type="text"
            value={startTime}
            disabled={disabled}
            onChange={handleStartTimeChange}
            required
          />
        </Field>

        <Field>
          <FieldLabel>End Time</FieldLabel>
          <Input
            name="startTime"
            type="text"
            value={endTime}
            disabled={disabled}
            onChange={handleEndTimeChange}
            required
          />
        </Field>
      </div>

      <div className="mb-4">
        <Field>
          <FieldLabel>Description</FieldLabel>
          <Textarea
            value={description}
            name="description"
            rows={12}
            disabled={disabled}
            onChange={handleAddressChange}
            required
          />
        </Field>
      </div>
    </CardContent>
  )
}
