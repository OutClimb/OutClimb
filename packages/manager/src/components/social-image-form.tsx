'use client'

import { Button } from '@/components/ui/button'
import { Calendar } from './ui/calendar'
import { CalendarIcon } from 'lucide-react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Field, FieldLabel } from './ui/field'
import { format } from 'date-fns'
import { Input } from './ui/input'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import type React from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { useRef, useState } from 'react'

export function SocialImageForm() {
  const canvas = useRef(null)
  const [date, setDate] = useState<Date>()
  const [formData, setFormData] = useState({
    month: new Date().getMonth() == 11 ? '0' : (new Date().getMonth() + 1).toString(),
    year: new Date().getMonth() == 11 ? new Date().getFullYear() + 1 : new Date().getFullYear(),
    numberOfEvents: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleMonthChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      month: value,
    }))
  }

  const handleNumberChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      numberOfEvents: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
  }

  return (
    <>
      <Card>
        <form onSubmit={handleSubmit}>
          <CardContent>
            <div className="mb-4">
              <Field>
                <FieldLabel>Month</FieldLabel>
                <Select value={formData.month} onValueChange={handleMonthChange}>
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
                <Input name="year" type="text" value={formData.year} onChange={handleChange} required />
              </Field>
            </div>

            <div className="mb-4">
              <Field>
                <FieldLabel>Number of Events</FieldLabel>
                <Select value={formData.numberOfEvents} onValueChange={handleNumberChange}>
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

          <CardContent className="border-t">
            <h3 className="my-4 font-bold text-xl">Event #1</h3>

            <div className="mb-4">
              <Field>
                <FieldLabel>Date</FieldLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      data-empty={!date}
                      className="data-[empty=true]:text-muted-foreground w-70 justify-start text-left font-normal">
                      <CalendarIcon />
                      {date ? format(date, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={date} onSelect={setDate} />
                  </PopoverContent>
                </Popover>
              </Field>
            </div>

            <div className="mb-4">
              <Field>
                <FieldLabel>Start Time</FieldLabel>
                <Input name="startTime" type="text" value={formData.year} onChange={handleChange} required />
              </Field>
            </div>

            <div className="mb-4">
              <Field>
                <FieldLabel>End Time</FieldLabel>
                <Input name="startTime" type="text" value={formData.year} onChange={handleChange} required />
              </Field>
            </div>

            <div className="mb-4">
              <Field>
                <FieldLabel>Location</FieldLabel>
                <Select>
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
          </CardContent>

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
