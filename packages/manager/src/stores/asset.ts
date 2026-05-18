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
      set({ data: { ...get().data, [asset.id]: asset } })
    },
    remove: (id: number) => {
      const { [id]: _, ...rest } = get().data
      set({ data: rest })
    },
  })),
)

export default useAssetStore
