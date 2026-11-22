export type CreateLocationResponse = Location
export type GetLocationsResponse = Array<Location>
export type GetLocationResponse = Location
export type UpdateLocationResponse = Location

export interface Location {
  id: number
  name: string
  mainImageName: string
  individualImageName: string
  backgroundImagePath: string
  color: string
  address: string
  city: string
  state: string
  zip: string
  startTime: string
  endTime: string
  description: string
  excerpt: string
  longDescription: string
}
