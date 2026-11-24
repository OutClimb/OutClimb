import { createCrudStore } from './crud'
import type { Event } from '@/types/event'

export default createCrudStore<Event>('event')
