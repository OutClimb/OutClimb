import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { jwtDecode } from 'jwt-decode'
import type { JwtClaims, UserState } from '@/types/user'

export const NO_PERMISSION = 0
export const READ_PERMISSION = 1
export const WRITE_PERMISSION = 2

const useUserStore = create<UserState>()(
  persist(
    devtools((set, get) => ({
      token: null,
      claims: null,
      user: () => {
        const { claims, token } = get()

        if (!token) {
          return null
        }

        if (!claims) {
          const decodedClaims = jwtDecode<JwtClaims>(token)
          set({
            claims: decodedClaims,
          })

          return {
            id: decodedClaims.usr.id,
            username: decodedClaims.usr.un,
            name: decodedClaims.usr.n,
            email: decodedClaims.usr.e,
            requiresPasswordReset: decodedClaims.usr.pr,
            role: decodedClaims.usr.r,
            permissions: decodedClaims.usr.p,
          }
        }

        return {
          id: claims.usr.id,
          username: claims.usr.un,
          name: claims.usr.n,
          email: claims.usr.e,
          requiresPasswordReset: claims.usr.pr,
          role: claims.usr.r,
          permissions: claims.usr.p,
        }
      },
      hasPermission: (entity: string, level: number) => {
        const { claims, token } = get()

        if (!token) {
          return false
        }

        if (!claims) {
          const decodedClaims = jwtDecode<JwtClaims>(token)
          set({
            claims: decodedClaims,
          })

          return decodedClaims.usr.p[entity] >= level
        }

        return claims.usr.p[entity] >= level
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
          claims: null,
        }),
    })),
    {
      name: 'user-storage',
    },
  ),
)

export default useUserStore
