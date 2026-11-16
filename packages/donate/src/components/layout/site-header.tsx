import { useState } from 'react'
import { cn } from 'cn'
import { HandHeart, Menu, X } from 'lucide-react'
import { HOME_URL, NAVIGATION_LINKS } from '@/lib/site-links'

const NAVIGATION_LINK_CLASS = 'rounded-lg px-3 py-2.5 text-sm font-medium text-ink hover:bg-track'

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-[#e2e1ee] bg-page text-ink">
      <nav className="mx-auto flex max-w-[1240px] items-center gap-x-6 gap-y-3 px-6 py-3.5">
        <a href={HOME_URL} className="mr-auto">
          <img src="/images/logo.svg" alt="OutClimb Queer Climbing" className="h-9 w-auto md:h-10" />
        </a>

        <div className="hidden items-center gap-0.5 md:flex">
          {NAVIGATION_LINKS.map((link) => (
            <a key={link.label} href={link.href} className={NAVIGATION_LINK_CLASS}>
              {link.label}
            </a>
          ))}
        </div>

        <a
          href="/"
          className="flex h-10 items-center gap-2 rounded-[10px] bg-brand px-3.5 text-sm font-medium text-white shadow-xs md:px-[18px]">
          <HandHeart aria-hidden="true" className="size-4" />
          Donate
        </a>

        <button
          type="button"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
          className="flex size-10 items-center justify-center rounded-[10px] border border-[#e2e1ee] bg-white shadow-xs md:hidden">
          {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      <div
        inert={!menuOpen}
        className={cn(
          'grid transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none md:hidden',
          menuOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}>
        <div className="overflow-hidden">
          <div className="flex flex-col gap-0.5 border-t border-[#e2e1ee] px-4 py-2">
            {NAVIGATION_LINKS.map((link) => (
              <a key={link.label} href={link.href} className={NAVIGATION_LINK_CLASS}>
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </header>
  )
}
