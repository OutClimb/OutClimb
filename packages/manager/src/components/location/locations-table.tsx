'use client'

import { ACTIONS_COLUMN_ID, type DataTableFeatures } from '@/components/data-table/data-table-features'
import { createColumnHelper, type SortingState } from '@tanstack/react-table'
import { DataTable } from '@/components/data-table/data-table'
import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Link } from '@tanstack/react-router'
import type { Location } from '@/types/location'
import { Pencil, Trash2 } from 'lucide-react'
import { RowActions } from '@/components/row-actions'
import { useMemo } from 'react'

const columnHelper = createColumnHelper<DataTableFeatures, Location>()

const SORT_BY_NAME: SortingState = [{ id: 'name', desc: false }]

const dataColumns = columnHelper.columns([
  columnHelper.accessor('name', { header: 'Name' }),
  columnHelper.accessor((item) => item.address.replaceAll('\n', ', '), { id: 'address', header: 'Address' }),
  columnHelper.accessor((item) => [item.city, item.state].filter(Boolean).join(', '), {
    id: 'cityState',
    header: 'City, State',
  }),
  columnHelper.accessor('startTime', { header: 'Normal Start Time' }),
  columnHelper.accessor('endTime', { header: 'Normal End Time' }),
])

function buildActionsColumn(onDelete: (id: number) => void) {
  return columnHelper.display({
    id: ACTIONS_COLUMN_ID,
    header: () => <span className="sr-only">Actions</span>,
    enableHiding: false,
    cell: ({ row }) => (
      <RowActions label={row.original.name}>
        <DropdownMenuItem asChild>
          <Link to="/manage/location/$id/edit" params={{ id: String(row.original.id) }}>
            <Pencil />
            Edit
          </Link>
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

export function LocationsTable({
  data,
  canEdit,
  onDelete,
}: {
  data: Array<Location>
  canEdit: boolean
  onDelete: (id: number) => void
}) {
  const columns = useMemo(
    () => (canEdit ? [...dataColumns, buildActionsColumn(onDelete)] : dataColumns),
    [canEdit, onDelete],
  )

  return (
    <DataTable
      tableId="locations"
      columns={columns}
      data={data}
      searchPlaceholder="Search locations..."
      initialSorting={SORT_BY_NAME}
    />
  )
}
