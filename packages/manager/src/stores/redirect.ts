import { createCrudStore } from './crud'
import type { Redirect } from '@/types/redirect'

export default createCrudStore<Redirect>('redirect')
