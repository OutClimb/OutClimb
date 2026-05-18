import { createCrudStore } from './crud'
import type { User } from '@/types/user'

export default createCrudStore<User>('user')
