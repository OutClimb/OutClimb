import { createCrudStore } from './crud'
import type { Form } from '@/types/form'

export default createCrudStore<Form>('form')
