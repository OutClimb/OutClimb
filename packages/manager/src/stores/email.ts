import { createCrudStore } from './crud'
import type { Email } from '@/types/email'

export default createCrudStore<Email>('email')
