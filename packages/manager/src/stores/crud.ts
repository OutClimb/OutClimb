import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export interface CrudStore<T extends { id: number }> {
  data: Record<number, T>
  isEmpty: () => boolean
  list: () => Array<T>
  populate: (items: Array<T>) => void
  populateSingle: (item: T) => void
  remove: (id: number) => void
}

export function createCrudStore<T extends { id: number }>(name: string) {
  return create<CrudStore<T>>()(
    devtools(
      (set, get) => ({
        data: {},
        isEmpty: () => Object.keys(get().data).length === 0,
        list: () => Object.values(get().data),
        populate: (items: Array<T>) => {
          set({
            data: items.reduce<Record<number, T>>((acc, item) => {
              acc[item.id] = item
              return acc
            }, {}),
          })
        },
        populateSingle: (item: T) => {
          set({ data: { ...get().data, [item.id]: item } })
        },
        remove: (id: number) => {
          const { [id]: _, ...rest } = get().data
          set({ data: rest })
        },
      }),
      { name },
    ),
  )
}
