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
      const newData = get().data
      newData[form.id] = form
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

export default useFormStore
