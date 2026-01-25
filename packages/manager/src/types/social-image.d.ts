export interface EventSocialImageFormData {
  day?: Date
  startTime: string
  endTime: string
  location: number
  address: string
  description: string
}

export interface GeneralSocialImageFormData {
  month: number
  year: number
  numberOfEvents: number
}

export interface SocialImageFieldData extends GeneralSocialImageFormData {
  events: Array<EventSocialImageFormData>
}
