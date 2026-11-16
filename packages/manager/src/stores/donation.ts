import { createCrudStore } from './crud'
import type { Donation } from '@/types/donation'

export default createCrudStore<Donation>('donation')
