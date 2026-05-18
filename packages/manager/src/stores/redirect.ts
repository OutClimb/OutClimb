import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Redirect, RedirectState } from '@/types/redirect'

const useRedirectStore = create<RedirectState>()(
  devtools((set, get) => ({
    data: {},
    isEmpty: () => {
      return Object.keys(get().data).length == 0
    },
    list: () => {
      return Object.values(get().data)
    },
    populate: (redirects: Array<Redirect>) => {
      set({
        data: redirects.reduce<Record<number, Redirect>>((newData, redirect) => {
          newData[redirect.id] = redirect
          return newData
        }, {}),
      })
    },
    populateSingle: (redirect: Redirect) => {
      set({ data: { ...get().data, [redirect.id]: redirect } })
    },
    remove: (id: number) => {
      const { [id]: _, ...rest } = get().data
      set({ data: rest })
    },
  })),
)

export default useRedirectStore
