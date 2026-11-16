import {
  CONTACT_EMAIL,
  CONTACT_PHONE,
  CONTACT_PHONE_LINK,
  EIN,
  FOOTER_EXPLORE_LINKS,
  FOOTER_SOCIAL_LINKS,
  PRIVACY_POLICY_URL,
} from '@/lib/site-links'

const COLUMN_TITLE_CLASS = 'font-semibold text-white'
const FOOTER_LINK_CLASS = 'hover:text-white'

function FooterWave() {
  return (
    <svg
      aria-hidden="true"
      className="-mb-px block h-12 w-full fill-footer md:h-20"
      preserveAspectRatio="none"
      viewBox="0 0 2000 190">
      <path d="M0 104 C200 75 350 47 500 47 C750 47 1250 162 1500 162 C1650 162 1800 133 2000 104 V190 H0 Z" />
    </svg>
  )
}

export function SiteFooter() {
  return (
    <footer className="text-sm text-footer-text">
      <FooterWave />
      <div className="bg-footer">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-10 px-6 pt-14 pb-8">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-3">
              <span className="text-2xl font-extrabold text-white">OutClimb</span>
              <span className="leading-relaxed">
                Be gay, go climb. Making climbing accessible to queer and trans folks across Minnesota.
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              <span className={COLUMN_TITLE_CLASS}>Explore</span>
              {FOOTER_EXPLORE_LINKS.map((link) => (
                <a key={link.label} href={link.href} className={FOOTER_LINK_CLASS}>
                  {link.label}
                </a>
              ))}
            </div>

            <div className="flex flex-col gap-2.5">
              <span className={COLUMN_TITLE_CLASS}>Contact</span>
              <a href={CONTACT_PHONE_LINK} className={FOOTER_LINK_CLASS}>
                {CONTACT_PHONE}
              </a>
              <a href={`mailto:${CONTACT_EMAIL}`} className={FOOTER_LINK_CLASS}>
                {CONTACT_EMAIL}
              </a>
            </div>

            <div className="flex flex-col gap-2.5">
              <span className={COLUMN_TITLE_CLASS}>Follow</span>
              {FOOTER_SOCIAL_LINKS.map((link) => (
                <a key={link.label} href={link.href} target="_blank" className={FOOTER_LINK_CLASS}>
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap justify-between gap-3 text-footer-muted">
            <span>© 2026 OutClimb · All rights reserved · EIN {EIN}</span>
            <a href={PRIVACY_POLICY_URL} className="text-footer-text hover:text-white">
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
