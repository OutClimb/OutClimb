import type { Role, RoleStore } from '@/types/role'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

const useRoleStore = create<RoleStore>()(
  devtools((set, get) => ({
    data: {},
    isEmpty: () => {
      return Object.keys(get().data).length == 0
    },
    list: () => {
      return Object.values(get().data)
    },
    populate: (roles: Array<Role>) => {
      set({
        data: roles.reduce<Record<number, Role>>((newData, role) => {
          newData[role.id] = role
          return newData
        }, {}),
      })
    },
    populateSingle: (role: Role) => {
      const newData = get().data
      newData[role.id] = role
      set({
        data: newData,
      })
    },
    remove: (id: number) => {
      const newData = get().data
      delete newData[id]
      set({
        data: newData,
      })
    },
  })),
)

export default useRoleStore
