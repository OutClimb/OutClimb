'use client'

import { CardContent } from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
import type { GeneralSocialImageFormData } from '@/types/social-image'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCallback } from 'react'

export interface GeneralSocialImageFieldsProps {
  month: number
  year: number
  numberOfEvents: number
  disabled: boolean
  onChange: (data: GeneralSocialImageFormData) => void
}

export function GeneralSocialImageFields({
  month,
  year,
  numberOfEvents,
  disabled,
  onChange,
}: GeneralSocialImageFieldsProps) {
  const handleMonthChange = useCallback(
    (value: string) => {
      onChange({
        month: parseInt(value, 10),
        year,
        numberOfEvents,
      })
    },
    [year, numberOfEvents, onChange],
  )

  const handleYearChange = useCallback(
    (value: string) => {
      onChange({
        month,
        year: parseInt(value, 10),
        numberOfEvents,
      })
    },
    [month, numberOfEvents, onChange],
  )

  const handleEventNumberChange = useCallback(
    (value: string) => {
      onChange({
        month,
        year,
        numberOfEvents: parseInt(value, 10),
      })
    },
    [month, year, onChange],
  )

  return (
    <CardContent>
      <div className="mb-4">
        <Field>
          <FieldLabel>Month</FieldLabel>
          <Select value={month.toString()} disabled={disabled} onValueChange={handleMonthChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select the month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">January</SelectItem>
              <SelectItem value="1">February</SelectItem>
              <SelectItem value="2">March</SelectItem>
              <SelectItem value="3">April</SelectItem>
              <SelectItem value="4">May</SelectItem>
              <SelectItem value="5">June</SelectItem>
              <SelectItem value="6">July</SelectItem>
              <SelectItem value="7">August</SelectItem>
              <SelectItem value="8">September</SelectItem>
              <SelectItem value="9">October</SelectItem>
              <SelectItem value="10">November</SelectItem>
              <SelectItem value="11">December</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div className="mb-4">
        <Field>
          <FieldLabel>Year</FieldLabel>
          <Select value={year.toString()} disabled={disabled} onValueChange={handleYearChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select the year" />
            </SelectTrigger>
            <SelectContent>
              {[...Array(3).keys()].map((index) => {
                const year = (new Date().getFullYear() + index).toString()
                return (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div className="mb-4">
        <Field>
          <FieldLabel>Number of Events</FieldLabel>
          <Select
            value={numberOfEvents === 0 ? '' : numberOfEvents.toString()}
            disabled={disabled}
            onValueChange={handleEventNumberChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select the number of events for the month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">Five</SelectItem>
              <SelectItem value="6">Six</SelectItem>
              <SelectItem value="7">Seven</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>
    </CardContent>
  )
}
