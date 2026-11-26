'use client'

import { ACTIONS_COLUMN_ID, type DataTableFeatures } from '@/components/data-table/data-table-features'
import type { Asset } from '@/types/asset'
import { createColumnHelper } from '@tanstack/react-table'
import { DataTable } from '@/components/data-table/data-table'
import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Pencil, SquareArrowOutUpRight, Trash2 } from 'lucide-react'
import { RowActions } from '@/components/row-actions'
import { useMemo } from 'react'

const columnHelper = createColumnHelper<DataTableFeatures, Asset>()

function getLink(fileName: string) {
  if (import.meta.env.MODE === 'dev') {
    return `http://assets.outclimb.local/q/${fileName}`
  } else {
    return `https://assets.outclimb.gay/q/${fileName}`
  }
}

const dataColumns = columnHelper.columns([
  columnHelper.accessor('fileName', {
    header: 'File',
    cell: ({ getValue }) => (
      <a href={getLink(getValue())} target="_blank" className="group hover:underline">
        {getValue()} <SquareArrowOutUpRight className="size-3 inline invisible group-hover:visible" />
      </a>
    ),
  }),
])

function buildActionsColumn(onEdit: (id: number) => void, onDelete: (id: number) => void) {
  return columnHelper.display({
    id: ACTIONS_COLUMN_ID,
    header: () => <span className="sr-only">Actions</span>,
    enableHiding: false,
    cell: ({ row }) => (
      <RowActions label={row.original.fileName}>
        <DropdownMenuItem onSelect={() => onEdit(row.original.id)}>
          <Pencil />
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={() => onDelete(row.original.id)}>
          <Trash2 />
          Delete
        </DropdownMenuItem>
      </RowActions>
    ),
  })
}

export function AssetsTable({
  data,
  canEdit,
  onEdit,
  onDelete,
}: {
  data: Array<Asset>
  canEdit: boolean
  onEdit: (id: number) => void
  onDelete: (id: number) => void
}) {
  const columns = useMemo(
    () => (canEdit ? [...dataColumns, buildActionsColumn(onEdit, onDelete)] : dataColumns),
    [canEdit, onEdit, onDelete],
  )

  return <DataTable tableId="assets" columns={columns} data={data} searchPlaceholder="Search assets..." />
}
