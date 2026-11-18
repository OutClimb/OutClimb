import { describe, expect, it } from 'vitest'
import { getOutputFileName, injectPageHead, renderMetaTags } from './static-page-meta.ts'

describe('renderMetaTags', () => {
  it('escapes special characters in every value', () => {
    const html = renderMetaTags([
      { title: 'A & B <script>' },
      { name: 'description', content: 'say "hi" & \'bye\'' },
      { property: 'og:title', content: '<b>' },
    ])

    expect(html).toContain('<title>A &amp; B &lt;script&gt;</title>')
    expect(html).toContain('content="say &quot;hi&quot; &amp; &#39;bye&#39;"')
    expect(html).toContain('content="&lt;b&gt;"')
    expect(html).not.toContain('<script>')
  })

  it('renders name and property tags', () => {
    const html = renderMetaTags([
      { name: 'description', content: 'd' },
      { property: 'og:type', content: 'website' },
    ])

    expect(html).toContain('<meta name="description" content="d" />')
    expect(html).toContain('<meta property="og:type" content="website" />')
  })
})

describe('injectPageHead', () => {
  const template = '<head><title>Generic</title></head><body></body>'

  it('replaces the generic title instead of duplicating it', () => {
    const html = injectPageHead(template, [{ title: 'Thank you' }, { property: 'og:title', content: 'Thank you' }])

    expect(html.match(/<title>/g)).toHaveLength(1)
    expect(html).not.toContain('Generic')
    expect(html).toContain('og:title')
  })

  it('keeps dollar sequences in values literal', () => {
    const html = injectPageHead(template, [{ title: '$& $1' }])

    expect(html).toContain('<title>$&amp; $1</title>')
  })
})

describe('getOutputFileName', () => {
  it.each([
    ['/', 'index.html'],
    ['/thank-you', 'thank-you/index.html'],
    ['/cancelled', 'cancelled/index.html'],
  ])('maps %s to %s', (pagePath, expected) => {
    expect(getOutputFileName(pagePath)).toBe(expected)
  })
})
