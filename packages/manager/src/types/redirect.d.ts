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

export interface RedirectState {
  data: Record<number, Redirect>
  isEmpty: () => boolean
  list: () => Array<Redirect>
  populate: (redirects: Array<Redirect>) => void
  populateSingle: (redirect: Redirect) => void
  remove: (id: number) => void
}
