'use client'

import { ACTIONS_COLUMN_ID, type DataTableFeatures } from '@/components/data-table/data-table-features'
import { Copy, Eye, Pencil, Trash2 } from 'lucide-react'
import { createColumnHelper, type SortingState } from '@tanstack/react-table'
import { DataTable } from '@/components/data-table/data-table'
import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import type { Form } from '@/types/form'
import { formatDateTime } from '@/lib/timezone'
import { getPublicFormLink } from '@/lib/form-link'
import { Link } from '@tanstack/react-router'
import { RowActions } from '@/components/row-actions'
import { useMemo } from 'react'

const columnHelper = createColumnHelper<DataTableFeatures, Form>()

const SORT_BY_NAME: SortingState = [{ id: 'name', desc: false }]

function formatOptionalDateTime(timestamp: number | undefined) {
  return timestamp === undefined ? '-' : formatDateTime(timestamp)
}

const dataColumns = columnHelper.columns([
  columnHelper.accessor('name', {
    header: 'Name',
    cell: ({ getValue, row }) => (
      <Link
        to="/manage/form/$id"
        params={{ id: row.original.slug }}
        className="font-medium hover:text-primary hover:underline underline-offset-4">
        {getValue()}
      </Link>
    ),
  }),
  columnHelper.accessor((item) => item.opensOn || undefined, {
    id: 'opensOn',
    header: 'Opens On',
    enableGlobalFilter: false,
    sortUndefined: 'last',
    cell: ({ getValue }) => formatOptionalDateTime(getValue()),
  }),
  columnHelper.accessor((item) => item.closesOn || undefined, {
    id: 'closesOn',
    header: 'Closes On',
    enableGlobalFilter: false,
    sortUndefined: 'last',
    cell: ({ getValue }) => formatOptionalDateTime(getValue()),
  }),
  columnHelper.accessor((item) => item.maxSubmissions || undefined, {
    id: 'maxSubmissions',
    header: 'Max Submissions',
    enableGlobalFilter: false,
    sortUndefined: 'last',
    cell: ({ getValue }) => getValue() ?? 'Unlimited',
  }),
])

function buildActionsColumn(canEdit: boolean, onDelete: (id: number) => void) {
  return columnHelper.display({
    id: ACTIONS_COLUMN_ID,
    header: () => <span className="sr-only">Actions</span>,
    enableHiding: false,
    cell: ({ row }) => (
      <RowActions label={row.original.name}>
        <DropdownMenuItem asChild>
          <a href={getPublicFormLink(row.original.slug)} target="_blank">
            <Eye />
            View
          </a>
        </DropdownMenuItem>
        {canEdit && (
          <>
            <DropdownMenuItem asChild>
              <Link to="/manage/form/$id/edit" params={{ id: row.original.slug }}>
                <Pencil />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/manage/form/$id/duplicate" params={{ id: row.original.slug }}>
                <Copy />
                Duplicate
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => onDelete(row.original.id)}>
              <Trash2 />
              Delete
            </DropdownMenuItem>
          </>
        )}
      </RowActions>
    ),
  })
}

export function FormsTable({
  data,
  canEdit,
  onDelete,
}: {
  data: Array<Form>
  canEdit: boolean
  onDelete: (id: number) => void
}) {
  const columns = useMemo(() => [...dataColumns, buildActionsColumn(canEdit, onDelete)], [canEdit, onDelete])

  return (
    <DataTable
      tableId="forms"
      columns={columns}
      data={data}
      searchPlaceholder="Search forms..."
      initialSorting={SORT_BY_NAME}
    />
  )
}
