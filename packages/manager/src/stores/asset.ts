import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Asset, AssetState } from '@/types/asset'

const useAssetStore = create<AssetState>()(
  devtools((set, get) => ({
    data: {},
    isEmpty: () => {
      return Object.keys(get().data).length == 0
    },
    list: () => {
      return Object.values(get().data)
    },
    populate: (assets: Array<Asset>) => {
      set({
        data: assets.reduce<Record<number, Asset>>((newData, asset) => {
          newData[asset.id] = asset
          return newData
        }, {}),
      })
    },
    populateSingle: (asset: Asset) => {
      const newData = get().data
      newData[asset.id] = asset
      set({
        data: newData,
      })
    },
    remove: (id: number) => {
      const newData = get().data
      delete newData[id]
      set({
        data: newData,
      })
    },
  })),
)

export default useAssetStore
