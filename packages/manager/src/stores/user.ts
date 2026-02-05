import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { User, UserStore } from '@/types/user'

const useUserStore = create<UserStore>()(
  devtools((set, get) => ({
    data: {},
    isEmpty: () => {
      return Object.keys(get().data).length == 0
    },
    list: () => {
      return Object.values(get().data)
    },
    populate: (users: Array<User>) => {
      set({
        data: users.reduce<Record<number, User>>((newData, user) => {
          newData[user.id] = user
          return newData
        }, {}),
      })
    },
    populateSingle: (user: User) => {
      const newData = get().data
      newData[user.id] = user
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

export default useUserStore
