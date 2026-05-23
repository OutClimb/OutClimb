import type {
  Form,
} from '@/types/form'
import { apiFetch } from './client'


export async function fetchForm(slug: string): Promise<Form> {
  return apiFetch<Form>('GET', `/api/v1/form/${slug}`)
}

export async function submitForm(slug: string, form: Form): Promise<unknown> {
  return apiFetch<unknown>('POST', `/api/v1/submission/${slug}`, form)
}
