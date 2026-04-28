import type {
  CreateRoleResponse,
  GetRoleResponse,
  GetRolesResponse,
  Role,
  UpdateRoleResponse,
} from '@/types/role'
import { UnauthorizedError } from '@/errors/unauthorized'

export async function createRole(token: string, role: Role): Promise<CreateRoleResponse> {
  let response
  try {
    response = await fetch(`/api/v1/role`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(role),
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

export async function fetchRole(token: string, id: number): Promise<GetRoleResponse> {
  let response
  try {
    response = await fetch(`/api/v1/role/${id}`, {
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

export async function fetchRoles(token: string): Promise<GetRolesResponse> {
  let response
  try {
    response = await fetch(`/api/v1/role`, {
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

export async function removeRole(token: string, id: number): Promise<boolean> {
  let response
  try {
    response = await fetch(`/api/v1/role/${id}`, {
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

export async function updateRole(token: string, role: Role): Promise<UpdateRoleResponse> {
  let response
  try {
    response = await fetch(`/api/v1/role/${role.id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(role),
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
