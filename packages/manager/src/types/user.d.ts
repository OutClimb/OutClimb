export interface JwtClaims {
  un: string
  r: string
  n: string
  e: string
  pr: boolean
}

export type TokenResponse = string

export interface User {
  username: string
  role: string
  name: string
  email: string
  requiresPasswordReset: boolean
}

export interface UserState {
  token: string | null
  user: () => User | null
  isLoggedIn: () => boolean
  login: (token: string) => void
  logout: () => void
}
