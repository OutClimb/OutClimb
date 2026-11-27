import { describe, expect, it } from 'vitest'
import { removeMarkdownEscapes } from './markdown'

describe('removeMarkdownEscapes', () => {
  it('removes backslashes before punctuation', () => {
    expect(removeMarkdownEscapes('5 \\* 3 \\[draft\\] snake\\_case \\#1')).toBe('5 * 3 [draft] snake_case #1')
  })

  it('keeps links intact', () => {
    expect(removeMarkdownEscapes('Sign the [waiver](https://example.com/waiver).')).toBe(
      'Sign the [waiver](https://example.com/waiver).',
    )
  })

  it('keeps backslashes before letters and digits', () => {
    expect(removeMarkdownEscapes('C:\\Users\\1')).toBe('C:\\Users\\1')
  })
})
