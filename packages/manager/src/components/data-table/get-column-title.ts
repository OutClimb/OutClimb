import type { Column, RowData } from '@tanstack/react-table'
import type { DataTableFeatures } from '@/components/data-table/data-table-features'

export function getColumnTitle<TData extends RowData>(column: Column<DataTableFeatures, TData, unknown>) {
  const { header } = column.columnDef
  return typeof header === 'string' ? header : column.id
}
