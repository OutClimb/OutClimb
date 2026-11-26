'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Column, ColumnVisibilityState, RowData } from '@tanstack/react-table'
import type { DataTableFeatures } from '@/components/data-table/data-table-features'
import { getColumnTitle } from '@/components/data-table/get-column-title'
import { Settings2 } from 'lucide-react'

export function DataTableViewOptions<TData extends RowData>({
  columns,
  columnVisibility,
}: {
  columns: Array<Column<DataTableFeatures, TData, unknown>>
  columnVisibility: ColumnVisibilityState
}) {
  const hideableColumns = columns.filter((column) => column.getCanHide())

  if (hideableColumns.length === 0) {
    return null
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Settings2 />
          View
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {hideableColumns.map((column) => (
          <DropdownMenuCheckboxItem
            key={column.id}
            checked={columnVisibility[column.id] !== false}
            onCheckedChange={(isChecked) => column.toggleVisibility(isChecked)}
            onSelect={(event) => event.preventDefault()}>
            {getColumnTitle(column)}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
