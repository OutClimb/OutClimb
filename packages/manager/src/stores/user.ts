import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { jwtDecode } from 'jwt-decode'
import type { JwtClaims, UserState } from '@/types/user'

const useUserStore = create<UserState>()(
  persist(
    devtools((set, get) => ({
      token: null,
      user: () => {
        const token = get().token

        if (!token) {
          return null
        }

        const claims = jwtDecode<JwtClaims>(token)
        return {
          username: claims.usr.un,
          role: claims.usr.r,
          name: claims.usr.n,
          email: claims.usr.e,
          requiresPasswordReset: claims.usr.pr,
        }
      },
      isLoggedIn: () => {
        return get().token !== null
      },
      login: (token: string) => {
        return set({
          token,
        })
      },
      logout: () =>
        set({
          token: null,
        }),
    })),
    {
      name: 'user-storage',
    },
  ),
)

export default useUserStore
