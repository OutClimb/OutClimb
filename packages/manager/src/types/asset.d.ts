export type CreateAssetResponse = Asset
export type GetAssetsResponse = Array<Asset>
export type GetAssetResponse = Asset
export type UpdateAssetResponse = Asset

export interface Asset {
  id: number
  fileName: string
}

export interface AssetRequest {
  id: number
  fileName: string
  contentType: string
  data: string
}

export interface AssetState {
  data: Record<number, Asset>
  isEmpty: () => boolean
  list: () => Array<Asset>
  populate: (redirects: Array<Asset>) => void
  populateSingle: (redirect: Asset) => void
  remove: (id: number) => void
}
