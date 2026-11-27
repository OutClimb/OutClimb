const MARKDOWN_ESCAPE_PATTERN = /\\([!-/:-@[-`{-~])/g

export function removeMarkdownEscapes(markdown: string): string {
  return markdown.replace(MARKDOWN_ESCAPE_PATTERN, '$1')
}
