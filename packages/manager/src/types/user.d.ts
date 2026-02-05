export interface JwtClaims {
  aud: string
  exp: number
  iat: number
  iss: string
  nbf: number
  sub: string
  usr: {
    id: number
    un: string
    n: string
    e: string
    pr: boolean
    r: string
    p: Record<string, number>
  }
}

export type TokenResponse = string

export interface User {
  id: number
  username: string
  name: string
  email: string
  requiresPasswordReset: boolean
  role: string
  permissions: Record<string, number>
}

export interface SelfState {
  token: string | null
  claims: JwtClaims | null
  user: () => User | null
  hasPermission: (entity: string, level: number) => boolean
  isLoggedIn: () => boolean
  login: (token: string) => boolean
  logout: () => void
}
