export type CreateUserResponse = User
export type GetUsersResponse = Array<User>
export type GetUserResponse = User
export type UpdateUserResponse = User

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

export interface UserStore {
  data: Record<number, User>
  isEmpty: () => boolean
  list: () => Array<User>
  populate: (redirects: Array<User>) => void
  populateSingle: (redirect: User) => void
  remove: (id: number) => void
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
