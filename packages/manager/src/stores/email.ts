import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Email, EmailState } from '@/types/email'

const useEmailStore = create<EmailState>()(
  devtools((set, get) => ({
    data: {},
    isEmpty: () => {
      return Object.keys(get().data).length == 0
    },
    list: () => {
      return Object.values(get().data)
    },
    populate: (emails: Array<Email>) => {
      set({
        data: emails.reduce<Record<number, Email>>((newData, email) => {
          newData[email.id] = email
          return newData
        }, {}),
      })
    },
    populateSingle: (email: Email) => {
      const newData = get().data
      newData[email.id] = email
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

export default useEmailStore
