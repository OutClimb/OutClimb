import { describe, expect, it } from 'vitest'
import { addTag, removeTag } from './tag'

describe('addTag', () => {
  it('appends a trimmed tag with collapsed whitespace', () => {
    expect(addTag(['Rope'], '  free   climbing ')).toEqual(['Rope', 'free climbing'])
  })

  it('ignores a tag that differs only by case', () => {
    expect(addTag(['Bouldering'], 'bouldering')).toEqual(['Bouldering'])
  })

  it('ignores a blank tag', () => {
    expect(addTag(['Rope'], '   ')).toEqual(['Rope'])
  })
})

describe('removeTag', () => {
  it('removes only the matching tag', () => {
    expect(removeTag(['Rope', 'Free'], 'Rope')).toEqual(['Free'])
  })
})
