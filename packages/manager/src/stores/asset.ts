import { createCrudStore } from './crud'
import type { Asset } from '@/types/asset'

export default createCrudStore<Asset>('asset')
