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
  startTime: string
  endTime: string
  description: string
}

export interface LocationState {
  data: Record<number, Location>
  isEmpty: () => boolean
  list: () => Array<Location>
  populate: (redirects: Array<Location>) => void
  populateSingle: (redirect: Location) => void
  remove: (id: number) => void
}
