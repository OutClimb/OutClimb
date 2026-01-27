import type {
  CreateAssetResponse,
  GetAssetResponse,
  GetAssetsResponse,
  AssetRequest,
  UpdateAssetResponse,
} from '@/types/asset'
import { UnauthorizedError } from '@/errors/unauthorized'

export async function createAsset(token: string, asset: AssetRequest): Promise<CreateAssetResponse> {
  let response
  try {
    response = await fetch(`/api/v1/asset`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(asset),
    })
  } catch {
    throw new Error('An error occurred. Please try again.')
  }

  if (response.status === 401) {
    throw new UnauthorizedError()
  } else if (response.status >= 300) {
    throw new Error('An error occurred. Please try again.')
  }

  try {
    return await response.json()
  } catch {
    throw new Error('An error occurred. Please try again.')
  }
}

export async function fetchAsset(token: string, id: number): Promise<GetAssetResponse> {
  let response
  try {
    response = await fetch(`/api/v1/asset/${id}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
  } catch {
    throw new Error('An error occurred. Please try again.')
  }

  if (response.status === 401) {
    throw new UnauthorizedError()
  } else if (response.status >= 300) {
    throw new Error('An error occurred. Please try again.')
  }

  try {
    return await response.json()
  } catch {
    throw new Error('An error occurred. Please try again.')
  }
}

export async function fetchAssets(token: string): Promise<GetAssetsResponse> {
  let response
  try {
    response = await fetch(`/api/v1/asset`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
  } catch {
    throw new Error('An error occurred. Please try again.')
  }

  if (response.status === 401) {
    throw new UnauthorizedError()
  } else if (response.status >= 300) {
    throw new Error('An error occurred. Please try again.')
  }

  try {
    return await response.json()
  } catch {
    throw new Error('An error occurred. Please try again.')
  }
}

export async function removeAsset(token: string, id: number): Promise<boolean> {
  let response
  try {
    response = await fetch(`/api/v1/asset/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
  } catch {
    throw new Error('An error occurred. Please try again.')
  }

  if (response.status === 401) {
    throw new UnauthorizedError()
  } else if (response.status >= 300) {
    throw new Error('An error occurred. Please try again.')
  }

  return true
}

export async function updateAsset(token: string, asset: AssetRequest): Promise<UpdateAssetResponse> {
  let response
  try {
    response = await fetch(`/api/v1/asset/${asset.id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(asset),
    })
  } catch {
    throw new Error('An error occurred. Please try again.')
  }

  if (response.status === 401) {
    throw new UnauthorizedError()
  } else if (response.status >= 300) {
    throw new Error('An error occurred. Please try again.')
  }

  try {
    return await response.json()
  } catch {
    throw new Error('An error occurred. Please try again.')
  }
}
