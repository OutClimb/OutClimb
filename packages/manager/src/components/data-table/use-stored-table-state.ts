import { functionalUpdate, type ColumnVisibilityState, type SortingState, type Updater } from '@tanstack/react-table'
import { loadTableState, saveTableState, type StoredTableState } from '@/lib/table-state-storage'
import { useEffect, useState } from 'react'

const NO_HIDDEN_COLUMNS: ColumnVisibilityState = {}

export function useStoredTableState(tableId: string, initialSorting: SortingState) {
  const defaultState: StoredTableState = { sorting: initialSorting, columnVisibility: NO_HIDDEN_COLUMNS }

  const [tableState, setTableState] = useState(() => loadTableState(tableId, defaultState))
  const [loadedTableId, setLoadedTableId] = useState(tableId)

  if (loadedTableId !== tableId) {
    setLoadedTableId(tableId)
    setTableState(loadTableState(tableId, defaultState))
  }

  useEffect(() => {
    saveTableState(tableId, tableState)
  }, [tableId, tableState])

  const setSorting = (updater: Updater<SortingState>) => {
    setTableState((current) => ({ ...current, sorting: functionalUpdate(updater, current.sorting) }))
  }

  const setColumnVisibility = (updater: Updater<ColumnVisibilityState>) => {
    setTableState((current) => ({
      ...current,
      columnVisibility: functionalUpdate(updater, current.columnVisibility),
    }))
  }

  return { ...tableState, setSorting, setColumnVisibility }
}
