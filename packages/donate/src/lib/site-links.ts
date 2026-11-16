const SITE_URL = 'https://outclimb.gay'

export const NAVIGATION_LINKS = [
  { label: 'Events', href: `${SITE_URL}/events` },
  { label: 'About Us', href: `${SITE_URL}/about-us` },
  { label: 'Community', href: `${SITE_URL}/community` },
  { label: 'Blog', href: `${SITE_URL}/blog` },
  { label: 'Contact', href: `${SITE_URL}/contact` },
]

export const FOOTER_EXPLORE_LINKS = [...NAVIGATION_LINKS.slice(0, 4), { label: 'Donate', href: '/' }]

export const FOOTER_SOCIAL_LINKS = [
  { label: 'Instagram', href: `https://www.instagram.com/outclimbmn` },
  { label: 'Discord', href: `https://discord.gg/tf76tqW8Ae` },
]

export const HOME_URL = SITE_URL
export const FINANCIAL_REPORT_URL = `${SITE_URL}/blog/2025-financial-report`
export const PRIVACY_POLICY_URL = `${SITE_URL}/privacy-policy`
export const CONTACT_EMAIL = 'info@outclimb.gay'
export const CONTACT_PHONE = '(612) 440-9209'
export const CONTACT_PHONE_LINK = 'tel:+16124409209'
export const EIN = '33-2647713'
