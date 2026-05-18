import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Form, FormState } from '@/types/form'

const useFormStore = create<FormState>()(
  devtools((set, get) => ({
    data: {},
    isEmpty: () => {
      return Object.keys(get().data).length == 0
    },
    list: () => {
      return Object.values(get().data)
    },
    populate: (forms: Array<Form>) => {
      set({
        data: forms.reduce<Record<number, Form>>((newData, form) => {
          newData[form.id] = form
          return newData
        }, {}),
      })
    },
    populateSingle: (form: Form) => {
      set({ data: { ...get().data, [form.id]: form } })
    },
    remove: (id: number) => {
      const { [id]: _, ...rest } = get().data
      set({ data: rest })
    },
  })),
)

export default useFormStore
