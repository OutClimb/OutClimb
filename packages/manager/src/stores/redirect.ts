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
      const newData = get().data
      newData[redirect.id] = redirect
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

export default useRedirectStore
