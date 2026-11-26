import { describe, expect, it } from 'vitest'
import { parseStoredTableState, type StoredTableState } from './table-state-storage'

const defaultState: StoredTableState = {
  sorting: [{ id: 'order', desc: false }],
  columnVisibility: {},
}

describe('parseStoredTableState', () => {
  it('returns the default state when nothing is stored', () => {
    expect(parseStoredTableState(null, defaultState)).toEqual(defaultState)
  })

  it('returns the default state when the stored value is not valid JSON', () => {
    expect(parseStoredTableState('{not json', defaultState)).toEqual(defaultState)
  })

  it('returns the default state when the stored value is not an object', () => {
    expect(parseStoredTableState('[]', defaultState)).toEqual(defaultState)
    expect(parseStoredTableState('"sorting"', defaultState)).toEqual(defaultState)
  })

  it('restores valid sorting and column visibility', () => {
    const stored: StoredTableState = {
      sorting: [{ id: 'name', desc: true }],
      columnVisibility: { address: false },
    }

    expect(parseStoredTableState(JSON.stringify(stored), defaultState)).toEqual(stored)
  })

  it('restores an empty sorting so a user can clear the default sort', () => {
    const stored = { sorting: [], columnVisibility: {} }

    expect(parseStoredTableState(JSON.stringify(stored), defaultState).sorting).toEqual([])
  })

  it('falls back per slice when only one slice is malformed', () => {
    const stored = {
      sorting: [{ id: 'name', desc: 'yes' }],
      columnVisibility: { address: false },
    }

    expect(parseStoredTableState(JSON.stringify(stored), defaultState)).toEqual({
      sorting: defaultState.sorting,
      columnVisibility: { address: false },
    })
  })

  it('falls back when column visibility contains non-boolean values', () => {
    const stored = { sorting: [], columnVisibility: { address: 'hidden' } }

    expect(parseStoredTableState(JSON.stringify(stored), defaultState).columnVisibility).toEqual({})
  })
})
