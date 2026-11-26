'use client'

import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Column, RowData, SortDirection } from '@tanstack/react-table'
import type { DataTableFeatures } from '@/components/data-table/data-table-features'

function SortIcon({ direction }: { direction: false | SortDirection }) {
  if (direction === 'asc') {
    return <ArrowUp />
  }

  if (direction === 'desc') {
    return <ArrowDown />
  }

  return <ArrowUpDown className="opacity-50" />
}

export function DataTableColumnHeader<TData extends RowData>({
  column,
  title,
  direction,
}: {
  column: Column<DataTableFeatures, TData, unknown>
  title: string
  direction: false | SortDirection
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-2.5 text-xs font-medium text-muted-foreground"
      onClick={column.getToggleSortingHandler()}>
      {title}
      <SortIcon direction={direction} />
    </Button>
  )
}
