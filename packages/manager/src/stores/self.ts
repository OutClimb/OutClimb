import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { jwtDecode } from 'jwt-decode'
import type { JwtClaims, SelfState } from '@/types/user'

export const NO_PERMISSION = 0
export const READ_PERMISSION = 1
export const WRITE_PERMISSION = 2

const useSelfStore = create<SelfState>()(
  persist(
    devtools((set, get) => ({
      token: null,
      claims: null,
      user: () => {
        const { claims } = get()
        if (!claims) return null
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
        const { claims } = get()
        if (!claims) return false
        if (claims.usr.r === 'Owner') return true
        if (!claims.usr.p) return false
        return claims.usr.p[entity] >= level
      },
      isLoggedIn: () => {
        return get().token !== null
      },
      login: (token: string) => {
        const claims = jwtDecode<JwtClaims>(token)
        return set({ token, claims })
      },
      logout: () =>
        set({
          token: null,
          claims: null,
        }),
    })),
    {
      name: 'self-storage',
    },
  ),
)

export default useSelfStore
