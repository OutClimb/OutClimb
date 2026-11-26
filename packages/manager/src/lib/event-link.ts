import type { EventLink } from '@/types/event'

export const MAX_EVENT_LINK_LABEL_LENGTH = 100
export const MAX_EVENT_LINK_URL_LENGTH = 2048

const REQUIRED_LINK_LABEL_MESSAGE = 'Please enter a label'
const INVALID_LINK_URL_MESSAGE = 'Please enter a full https:// URL'
const ALLOWED_LINK_PROTOCOL = 'https:'

export interface EventLinkErrors {
  label: string
  url: string
}

export function normalizeEventLink(link: EventLink): EventLink {
  return { label: link.label.trim().replace(/\s+/g, ' '), url: link.url.trim() }
}

export function isValidEventLinkUrl(url: string): boolean {
  if (url.length > MAX_EVENT_LINK_URL_LENGTH || !URL.canParse(url)) return false

  const parsedUrl = new URL(url)
  return parsedUrl.protocol === ALLOWED_LINK_PROTOCOL && parsedUrl.hostname !== ''
}

export function validateEventLink(link: EventLink): EventLinkErrors {
  const normalized = normalizeEventLink(link)
  return {
    label: normalized.label === '' ? REQUIRED_LINK_LABEL_MESSAGE : '',
    url: isValidEventLinkUrl(normalized.url) ? '' : INVALID_LINK_URL_MESSAGE,
  }
}

export function swapEventLinks(links: Array<EventLink>, index: number, otherIndex: number): Array<EventLink> {
  const isOutOfRange = (i: number) => i < 0 || i >= links.length
  if (isOutOfRange(index) || isOutOfRange(otherIndex)) return links

  const swapped = [...links]
  swapped[index] = links[otherIndex]
  swapped[otherIndex] = links[index]
  return swapped
}

export function hasEventLinkErrors(linkErrors: Array<EventLinkErrors>): boolean {
  return linkErrors.some((errors) => errors.label !== '' || errors.url !== '')
}
