import type {
  CreateFormResponse,
  Form,
  GetFormsResponse,
  GetSubmissionsResponse,
  UpdateFormResponse,
} from '@/types/form'
import { apiFetch } from './client'

export async function createForm(token: string, form: Form): Promise<CreateFormResponse> {
  return apiFetch<CreateFormResponse>(token, 'POST', '/api/v1/form', form)
}

export async function fetchForm(token: string, slug: string): Promise<Form> {
  return apiFetch<Form>(token, 'GET', `/api/v1/form/${slug}`)
}

export async function fetchForms(token: string): Promise<GetFormsResponse> {
  return apiFetch<GetFormsResponse>(token, 'GET', '/api/v1/form')
}

export async function removeForm(token: string, id: number): Promise<boolean> {
  await apiFetch(token, 'DELETE', `/api/v1/form/${id}`)
  return true
}

export async function updateForm(token: string, form: Form): Promise<UpdateFormResponse> {
  return apiFetch<UpdateFormResponse>(token, 'PUT', `/api/v1/form/${form.id}`, form)
}

export async function fetchSubmissions(token: string, formId: number): Promise<GetSubmissionsResponse> {
  return apiFetch<GetSubmissionsResponse>(token, 'GET', `/api/v1/submission?formId=${formId}`)
}

export async function removeSubmission(token: string, id: number): Promise<boolean> {
  await apiFetch(token, 'DELETE', `/api/v1/submission/${id}`)
  return true
}
