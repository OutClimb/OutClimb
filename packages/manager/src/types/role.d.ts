export type CreateRoleResponse = Role
export type GetRolesResponse = Array<Role>
export type GetRoleResponse = Role
export type UpdateRoleResponse = Role

export interface Role {
  id: number
  name: string
  order: number
}

export interface RoleStore {
  data: Record<number, Role>
  isEmpty: () => boolean
  list: () => Array<Role>
  populate: (roles: Array<Role>) => void
  populateSingle: (role: Role) => void
  remove: (id: number) => void
}
