'use client'

import { ACTIONS_COLUMN_ID, type DataTableFeatures } from '@/components/data-table/data-table-features'
import { createColumnHelper, type SortingState } from '@tanstack/react-table'
import { DataTable } from '@/components/data-table/data-table'
import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import type { Event } from '@/types/event'
import { formatDateTime } from '@/lib/timezone'
import { Link } from '@tanstack/react-router'
import { Pencil, Trash2 } from 'lucide-react'
import { RowActions } from '@/components/row-actions'
import { useMemo } from 'react'

const columnHelper = createColumnHelper<DataTableFeatures, Event>()

const SORT_BY_NEWEST_START: SortingState = [{ id: 'startsAt', desc: true }]

const dataColumns = columnHelper.columns([
  columnHelper.accessor('title', { header: 'Title' }),
  columnHelper.accessor((item) => new Date(item.startsAt).getTime(), {
    id: 'startsAt',
    header: 'Starts',
    enableGlobalFilter: false,
    cell: ({ getValue }) => formatDateTime(getValue()),
  }),
  columnHelper.accessor('locationName', { header: 'Location' }),
  columnHelper.accessor('city', { header: 'City' }),
])

function buildActionsColumn(canDelete: boolean, canEdit: boolean, onDelete: (id: number) => void) {
  return columnHelper.display({
    id: ACTIONS_COLUMN_ID,
    header: () => <span className="sr-only">Actions</span>,
    enableHiding: false,
    cell: ({ row }) => (
      <RowActions label={row.original.title}>
        {canEdit && (
          <DropdownMenuItem asChild>
            <Link to="/manage/event/$id/edit" params={{ id: String(row.original.id) }}>
              <Pencil />
              Edit
            </Link>
          </DropdownMenuItem>
        )}
        {canDelete && canEdit && <DropdownMenuSeparator />}
        {canDelete && (
          <DropdownMenuItem variant="destructive" onSelect={() => onDelete(row.original.id)}>
            <Trash2 />
            Delete
          </DropdownMenuItem>
        )}
      </RowActions>
    ),
  })
}

export function EventsTable({
  data,
  canDelete,
  canEdit,
  onDelete,
}: {
  data: Array<Event>
  canDelete: boolean
  canEdit: boolean
  onDelete: (id: number) => void
}) {
  const columns = useMemo(
    () => (canDelete || canEdit ? [...dataColumns, buildActionsColumn(canDelete, canEdit, onDelete)] : dataColumns),
    [canDelete, canEdit, onDelete],
  )

  return (
    <DataTable
      tableId="events"
      columns={columns}
      data={data}
      searchPlaceholder="Search events..."
      initialSorting={SORT_BY_NEWEST_START}
    />
  )
}
