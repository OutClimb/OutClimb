export type CreateEventResponse = Event
export type GetEventsResponse = Array<Event>
export type GetEventResponse = Event
export type UpdateEventResponse = Event
export type GetEventTagsResponse = Array<string>

export interface EventLink {
  label: string
  url: string
}

export interface EventFeaturedImage {
  assetId: number
  url: string
  altText: string
}

export interface Event {
  id: number
  title: string
  slug: string
  startsAt: string
  endsAt: string
  locationId: number | null
  locationName: string
  address: string
  city: string
  state: string
  zip: string
  featuredImage: EventFeaturedImage
  excerpt: string
  body: string
  tags: Array<string>
  links: Array<EventLink>
}

export interface EventRequest {
  title: string
  slug: string
  startsAt: string
  endsAt: string
  locationId: number | null
  locationName: string
  address: string
  city: string
  state: string
  zip: string
  featuredImageAssetId: number
  featuredImageAltText: string
  excerpt: string
  body: string
  tags: Array<string>
  links: Array<EventLink>
}
