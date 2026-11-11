import { describe, expect, it } from 'vitest'
import { toCsv } from '@/lib/csv'

describe('toCsv', () => {
  it('joins cells with commas and rows with CRLF', () => {
    expect(
      toCsv([
        ['a', 'b'],
        ['c', 'd'],
      ]),
    ).toBe('a,b\r\nc,d')
  })

  it('quotes cells containing commas, quotes, or line breaks', () => {
    expect(toCsv([['a,b', 'say "hi"', 'line1\nline2']])).toBe('"a,b","say ""hi""","line1\nline2"')
  })

  it.each(['=SUM(A1:A2)', '+1', '-1', '@cmd', '\tvalue', '\rvalue'])('neutralizes formula-looking cell %j', (cell) => {
    expect(toCsv([[cell]])).toContain(`'${cell}`)
  })

  it('quotes a neutralized cell that also needs quoting', () => {
    expect(toCsv([['=A1,B1']])).toBe('"\'=A1,B1"')
  })

  it('leaves formula characters alone when they are not leading', () => {
    expect(toCsv([['a=b']])).toBe('a=b')
  })

  it('returns an empty string for no rows', () => {
    expect(toCsv([])).toBe('')
  })
})
