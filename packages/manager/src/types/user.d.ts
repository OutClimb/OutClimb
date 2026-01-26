export interface JwtClaims {
  aud: string
  exp: number
  iat: number
  iss: string
  nbf: number
  sub: string
  usr: {
    un: string
    r: string
    n: string
    e: string
    pr: boolean
  }
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
  login: (token: string) => boolean
  logout: () => void
}
