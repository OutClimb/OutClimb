import type {
  CreateAssetResponse,
  GetAssetResponse,
  GetAssetsResponse,
  AssetRequest,
  UpdateAssetResponse,
} from '@/types/asset'
import { apiFetch } from './client'

export async function createAsset(token: string, asset: AssetRequest): Promise<CreateAssetResponse> {
  return apiFetch<CreateAssetResponse>(token, 'POST', '/api/v1/asset', asset)
}

export async function fetchAsset(token: string, id: number): Promise<GetAssetResponse> {
  return apiFetch<GetAssetResponse>(token, 'GET', `/api/v1/asset/${id}`)
}

export async function fetchAssets(token: string): Promise<GetAssetsResponse> {
  return apiFetch<GetAssetsResponse>(token, 'GET', '/api/v1/asset')
}

export async function removeAsset(token: string, id: number): Promise<boolean> {
  await apiFetch(token, 'DELETE', `/api/v1/asset/${id}`)
  return true
}

export async function updateAsset(token: string, asset: AssetRequest): Promise<UpdateAssetResponse> {
  return apiFetch<UpdateAssetResponse>(token, 'PUT', `/api/v1/asset/${asset.id}`, asset)
}
