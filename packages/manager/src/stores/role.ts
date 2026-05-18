import { createCrudStore } from './crud'
import type { Role } from '@/types/role'

export default createCrudStore<Role>('role')
