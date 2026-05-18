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
      set({ data: { ...get().data, [email.id]: email } })
    },
    remove: (id: number) => {
      const { [id]: _, ...rest } = get().data
      set({ data: rest })
    },
  })),
)

export default useEmailStore
