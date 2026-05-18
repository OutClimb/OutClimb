export type CreateRoleResponse = Role
export type GetRolesResponse = Array<Role>
export type GetRoleResponse = Role
export type UpdateRoleResponse = Role

export interface Role {
  id: number
  name: string
  order: number
  permissions: Record<string, number>
}
