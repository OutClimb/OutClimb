import type { Location } from '@/types/location'

export default (loc: Location | undefined) => {
  if (!loc || !loc.address || !loc.city || !loc.state || !loc.zip) {
    return ''
  }

  return `${loc.address}\n${loc.city}, ${loc.state} ${loc.zip}`
}
