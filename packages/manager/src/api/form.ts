import type {
  CreateFormResponse,
  Form,
  GetFormsResponse,
  GetSubmissionsResponse,
  UpdateFormResponse,
} from '@/types/form'
import { UnauthorizedError } from '@/errors/unauthorized'

export async function createForm(token: string, form: Form): Promise<CreateFormResponse> {
  let response
  try {
    response = await fetch(`/api/v1/form`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(form),
    })
  } catch {
    throw new Error('An error occurred. Please try again.')
  }

  if (response.status === 401) {
    throw new UnauthorizedError()
  } else if (response.status >= 300) {
    throw new Error('An error occurred. Please try again.')
  }

  try {
    return await response.json()
  } catch {
    throw new Error('An error occurred. Please try again.')
  }
}

export async function fetchForms(token: string): Promise<GetFormsResponse> {
  let response
  try {
    response = await fetch(`/api/v1/form`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
  } catch {
    throw new Error('An error occurred. Please try again.')
  }

  if (response.status === 401) {
    throw new UnauthorizedError()
  } else if (response.status >= 300) {
    throw new Error('An error occurred. Please try again.')
  }

  try {
    return await response.json()
  } catch {
    throw new Error('An error occurred. Please try again.')
  }
}

export async function removeForm(token: string, id: number): Promise<boolean> {
  let response
  try {
    response = await fetch(`/api/v1/form/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
  } catch {
    throw new Error('An error occurred. Please try again.')
  }

  if (response.status === 401) {
    throw new UnauthorizedError()
  } else if (response.status >= 300) {
    throw new Error('An error occurred. Please try again.')
  }

  return true
}

export async function updateForm(token: string, form: Form): Promise<UpdateFormResponse> {
  let response
  try {
    response = await fetch(`/api/v1/form/${form.id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(form),
    })
  } catch {
    throw new Error('An error occurred. Please try again.')
  }

  if (response.status === 401) {
    throw new UnauthorizedError()
  } else if (response.status >= 300) {
    throw new Error('An error occurred. Please try again.')
  }

  try {
    return await response.json()
  } catch {
    throw new Error('An error occurred. Please try again.')
  }
}

export async function fetchSubmissions(token: string, formId: number): Promise<GetSubmissionsResponse> {
  let response
  try {
    response = await fetch(`/api/v1/submission?formId=${formId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
  } catch {
    throw new Error('An error occurred. Please try again.')
  }

  if (response.status === 401) {
    throw new UnauthorizedError()
  } else if (response.status >= 300) {
    throw new Error('An error occurred. Please try again.')
  }

  try {
    return await response.json()
  } catch {
    throw new Error('An error occurred. Please try again.')
  }
}

export async function removeSubmission(token: string, id: number): Promise<boolean> {
  let response
  try {
    response = await fetch(`/api/v1/submission/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
  } catch {
    throw new Error('An error occurred. Please try again.')
  }

  if (response.status === 401) {
    throw new UnauthorizedError()
  } else if (response.status >= 300) {
    throw new Error('An error occurred. Please try again.')
  }

  return true
}
