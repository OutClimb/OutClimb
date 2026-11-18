import type { Plugin } from 'vite'
import { DONATE_PAGES, buildPageMeta, type PageMetaEntry } from '../src/lib/page-meta.ts'

const TEMPLATE_FILE_NAME = 'index.html'
const ROOT_PATH = '/'
const TITLE_ELEMENT_PATTERN = /<title>[\s\S]*?<\/title>/

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => HTML_ESCAPES[character])
}

function renderMetaTag(entry: PageMetaEntry): string {
  if ('title' in entry) {
    return `<title>${escapeHtml(entry.title)}</title>`
  }

  const content = escapeHtml(entry.content)
  if ('name' in entry) {
    return `<meta name="${escapeHtml(entry.name)}" content="${content}" />`
  }

  return `<meta property="${escapeHtml(entry.property)}" content="${content}" />`
}

export function renderMetaTags(meta: PageMetaEntry[]): string {
  return meta.map(renderMetaTag).join('\n    ')
}

export function injectPageHead(html: string, meta: PageMetaEntry[]): string {
  return html.replace(TITLE_ELEMENT_PATTERN, () => renderMetaTags(meta))
}

export function getOutputFileName(pagePath: string): string {
  if (pagePath === ROOT_PATH) {
    return TEMPLATE_FILE_NAME
  }

  return `${pagePath.replace(/^\//, '')}/${TEMPLATE_FILE_NAME}`
}

export function staticPageMeta(): Plugin {
  return {
    name: 'static-page-meta',
    apply: 'build',
    enforce: 'post',
    generateBundle: {
      order: 'post',
      handler(_options, bundle) {
        const template = bundle[TEMPLATE_FILE_NAME]
        if (template?.type !== 'asset' || typeof template.source !== 'string') {
          this.error(`${TEMPLATE_FILE_NAME} was not emitted as a text asset`)
        }

        const templateHtml = template.source
        for (const page of Object.values(DONATE_PAGES)) {
          const fileName = getOutputFileName(page.path)
          const html = injectPageHead(templateHtml, buildPageMeta(page))

          if (fileName === TEMPLATE_FILE_NAME) {
            template.source = html
          } else {
            this.emitFile({ type: 'asset', fileName, source: html })
          }
        }
      },
    },
  }
}
