import type { CreateRoleResponse, GetRoleResponse, GetRolesResponse, Role, UpdateRoleResponse } from '@/types/role'
import { apiFetch } from './client'

export async function createRole(token: string, role: Role): Promise<CreateRoleResponse> {
  return apiFetch<CreateRoleResponse>(token, 'POST', '/api/v1/role', role)
}

export async function fetchRole(token: string, id: number): Promise<GetRoleResponse> {
  return apiFetch<GetRoleResponse>(token, 'GET', `/api/v1/role/${id}`)
}

export async function fetchRoles(token: string): Promise<GetRolesResponse> {
  return apiFetch<GetRolesResponse>(token, 'GET', '/api/v1/role')
}

export async function removeRole(token: string, id: number): Promise<boolean> {
  await apiFetch(token, 'DELETE', `/api/v1/role/${id}`)
  return true
}

export async function updateRole(token: string, role: Role): Promise<UpdateRoleResponse> {
  return apiFetch<UpdateRoleResponse>(token, 'PUT', `/api/v1/role/${role.id}`, role)
}
