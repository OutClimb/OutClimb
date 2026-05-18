export type CreateRedirectResponse = Redirect
export type GetRedirectsResponse = Array<Redirect>
export type GetRedirectResponse = Redirect
export type UpdateRedirectResponse = Redirect

export interface Redirect {
  id: number
  fromPath: string
  toUrl: string
  startsOn: number
  stopsOn: number
}
