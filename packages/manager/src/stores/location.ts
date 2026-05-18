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
    populate: (locations: Array<Location>) => {
      set({
        data: locations.reduce<Record<number, Location>>((newData, location) => {
          newData[location.id] = location
          return newData
        }, {}),
      })
    },
    populateSingle: (location: Location) => {
      set({ data: { ...get().data, [location.id]: location } })
    },
    remove: (id: number) => {
      const { [id]: _, ...rest } = get().data
      set({ data: rest })
    },
  })),
)

export default useLocationStore
