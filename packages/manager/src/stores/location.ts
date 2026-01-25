import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Location, LocationState } from '@/types/location'

const useLocationStore = create<LocationState>()(
  devtools((set, get) => ({
    data: {},
    isEmpty: () => {
      return Object.keys(get().data).length == 0
    },
    list: () => {
      return Object.values(get().data)
    },
    populate: (redirects: Array<Location>) => {
      set({
        data: redirects.reduce<Record<number, Location>>((newData, redirect) => {
          newData[redirect.id] = redirect
          return newData
        }, {}),
      })
    },
    populateSingle: (location: Location) => {
      const newData = get().data
      newData[location.id] = location
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

export default useLocationStore
