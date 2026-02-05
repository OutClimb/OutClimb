export type CreateRoleResponse = Role
export type GetRoleResponse = Array<Role>
export type GetRoleResponse = Role
export type UpdateRoleResponse = Role

export interface Role {
  id: number
  username: string
  name: string
  email: string
  requiresPasswordReset: boolean
  role: string
  permissions: Record<string, number>
}

export interface RoleStore {
  data: Record<number, Role>
  isEmpty: () => boolean
  list: () => Array<Role>
  populate: (role: Array<Role>) => void
  populateSingle: (role: Role) => void
  remove: (id: number) => void
}
