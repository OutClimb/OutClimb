export const SITE_NAME = 'OutClimb - Queer Climbing'
export const SITE_ORIGIN = 'https://donate.outclimb.gay'
export const SITE_DESCRIPTION =
  'Help us make climbing accessible. We are a nonprofit working to make climbing accessible to as many trans and queer people as possible.'
export const HERO_IMAGE_URL = `${SITE_ORIGIN}/images/hero.jpg`
export const HERO_IMAGE_WIDTH = 648
export const HERO_IMAGE_HEIGHT = 320

const ROOT_PATH = '/'

export type PageMetaEntry =
  | { title: string }
  | { name: string; content: string }
  | { property: string; content: string }

export interface DonatePage {
  path: string
  title: string
}

export const DONATE_PAGES = {
  donate: { path: '/', title: 'Donate' },
  thankYou: { path: '/thank-you', title: 'Thank you' },
  cancelled: { path: '/cancelled', title: 'Donation cancelled' },
} satisfies Record<string, DonatePage>

export function buildPageMeta({ path, title }: DonatePage): PageMetaEntry[] {
  const fullTitle = `${title} — ${SITE_NAME}`
  const pageUrl = path === ROOT_PATH ? SITE_ORIGIN : `${SITE_ORIGIN}${path}`

  return [
    { title: fullTitle },
    { name: 'description', content: SITE_DESCRIPTION },
    { property: 'og:site_name', content: SITE_NAME },
    { property: 'og:title', content: fullTitle },
    { property: 'og:url', content: pageUrl },
    { property: 'og:type', content: 'website' },
    { property: 'og:description', content: SITE_DESCRIPTION },
    { property: 'og:image', content: HERO_IMAGE_URL },
    { property: 'og:image:width', content: String(HERO_IMAGE_WIDTH) },
    { property: 'og:image:height', content: String(HERO_IMAGE_HEIGHT) },
  ]
}
