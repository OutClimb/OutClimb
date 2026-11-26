import type { ColumnVisibilityState, SortingState } from '@tanstack/react-table'

export interface StoredTableState {
  sorting: SortingState
  columnVisibility: ColumnVisibilityState
}

const STORAGE_KEY_PREFIX = 'outclimb:data-table:'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isSortingState(value: unknown): value is SortingState {
  return (
    Array.isArray(value) &&
    value.every((sort) => isRecord(sort) && typeof sort.id === 'string' && typeof sort.desc === 'boolean')
  )
}

function isColumnVisibilityState(value: unknown): value is ColumnVisibilityState {
  return isRecord(value) && Object.values(value).every((isVisible) => typeof isVisible === 'boolean')
}

export function buildTableStateStorageKey(tableId: string) {
  return `${STORAGE_KEY_PREFIX}${tableId}`
}

export function parseStoredTableState(rawValue: string | null, defaultState: StoredTableState): StoredTableState {
  if (rawValue === null) {
    return defaultState
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(rawValue)
  } catch {
    return defaultState
  }

  if (!isRecord(parsed)) {
    return defaultState
  }

  return {
    sorting: isSortingState(parsed.sorting) ? parsed.sorting : defaultState.sorting,
    columnVisibility: isColumnVisibilityState(parsed.columnVisibility)
      ? parsed.columnVisibility
      : defaultState.columnVisibility,
  }
}

export function loadTableState(tableId: string, defaultState: StoredTableState): StoredTableState {
  try {
    return parseStoredTableState(localStorage.getItem(buildTableStateStorageKey(tableId)), defaultState)
  } catch {
    return defaultState
  }
}

export function saveTableState(tableId: string, state: StoredTableState) {
  try {
    localStorage.setItem(buildTableStateStorageKey(tableId), JSON.stringify(state))
  } catch {
    // Storage can be unavailable (private browsing, quota); the table still works without persistence.
  }
}
