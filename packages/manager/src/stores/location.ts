import { createCrudStore } from './crud'
import type { Location } from '@/types/location'

export default createCrudStore<Location>('location')
