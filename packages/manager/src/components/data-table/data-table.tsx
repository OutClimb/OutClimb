'use client'

import {
  ACTIONS_COLUMN_ID,
  dataTableFeatures,
  type DataTableFeatures,
} from '@/components/data-table/data-table-features'
import type { ColumnDef, Header, RowData, SortDirection, SortingState } from '@tanstack/react-table'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { DataTableViewOptions } from '@/components/data-table/data-table-view-options'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FlexRender, useTable } from '@tanstack/react-table'
import { useStoredTableState } from '@/components/data-table/use-stored-table-state'

const NO_INITIAL_SORTING: SortingState = []

function getSortDirection(sorting: SortingState, columnId: string): false | SortDirection {
  const columnSort = sorting.find((sort) => sort.id === columnId)

  if (columnSort === undefined) {
    return false
  }

  return columnSort.desc ? 'desc' : 'asc'
}

function getAriaSort(direction: false | SortDirection) {
  if (direction === 'asc') {
    return 'ascending'
  }

  if (direction === 'desc') {
    return 'descending'
  }

  return undefined
}

function DataTableHeaderContent<TData extends RowData>({
  header,
  sortDirection,
}: {
  header: Header<DataTableFeatures, TData, unknown>
  sortDirection: false | SortDirection
}) {
  const { column } = header
  const title = column.columnDef.header

  if (column.getCanSort() && typeof title === 'string') {
    return <DataTableColumnHeader column={column} title={title} direction={sortDirection} />
  }

  return <FlexRender header={header} />
}

export function DataTable<TData extends RowData>({
  tableId,
  columns,
  data,
  searchPlaceholder = 'Search...',
  initialSorting = NO_INITIAL_SORTING,
}: {
  tableId: string
  columns: Array<ColumnDef<DataTableFeatures, TData, unknown>>
  data: Array<TData>
  searchPlaceholder?: string
  initialSorting?: SortingState
}) {
  const { sorting, columnVisibility, setSorting, setColumnVisibility } = useStoredTableState(tableId, initialSorting)

  const table = useTable({
    features: dataTableFeatures,
    columns,
    data,
    state: { sorting, columnVisibility },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    globalFilterFn: 'includesString',
  })

  const rows = table.getRowModel().rows
  const visibleColumnCount = table.getVisibleLeafColumns().length

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 p-4">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            aria-label={searchPlaceholder}
            placeholder={searchPlaceholder}
            value={table.state.globalFilter ?? ''}
            onChange={(event) => table.setGlobalFilter(event.target.value)}
            className="pl-8"
          />
        </div>
        <div className="ml-auto">
          <DataTableViewOptions columns={table.getAllLeafColumns()} columnVisibility={columnVisibility} />
        </div>
      </div>

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const sortDirection = getSortDirection(sorting, header.column.id)

                return (
                  <TableHead
                    key={header.id}
                    aria-sort={getAriaSort(sortDirection)}
                    className={header.column.id === ACTIONS_COLUMN_ID ? 'w-12' : undefined}>
                    {!header.isPlaceholder && <DataTableHeaderContent header={header} sortDirection={sortDirection} />}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={visibleColumnCount} className="h-24 text-center text-muted-foreground">
                No results.
              </TableCell>
            </TableRow>
          )}
          {rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className={cell.column.columnDef.meta?.cellClassName}>
                  <table.FlexRender cell={cell} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
