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
      set({ data: { ...get().data, [user.id]: user } })
    },
    remove: (id: number) => {
      const { [id]: _, ...rest } = get().data
      set({ data: rest })
    },
  })),
)

export default useUserStore
