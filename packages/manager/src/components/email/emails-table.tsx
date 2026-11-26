'use client'

import { ACTIONS_COLUMN_ID, type DataTableFeatures } from '@/components/data-table/data-table-features'
import { createColumnHelper, type SortingState } from '@tanstack/react-table'
import { DataTable } from '@/components/data-table/data-table'
import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import type { Email } from '@/types/email'
import { Link } from '@tanstack/react-router'
import { Pencil, Trash2 } from 'lucide-react'
import { RowActions } from '@/components/row-actions'
import { useMemo } from 'react'

const columnHelper = createColumnHelper<DataTableFeatures, Email>()

const SORT_BY_NAME: SortingState = [{ id: 'name', desc: false }]

const dataColumns = columnHelper.columns([
  columnHelper.accessor('name', { header: 'Name' }),
  columnHelper.accessor('slug', { header: 'Slug' }),
  columnHelper.accessor('subject', { header: 'Subject' }),
])

function buildActionsColumn(onDelete: (id: number) => void) {
  return columnHelper.display({
    id: ACTIONS_COLUMN_ID,
    header: () => <span className="sr-only">Actions</span>,
    enableHiding: false,
    cell: ({ row }) => (
      <RowActions label={row.original.name}>
        <DropdownMenuItem asChild>
          <Link to="/manage/email/$id/edit" params={{ id: row.original.id.toString() }}>
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

export function EmailsTable({
  data,
  canEdit,
  onDelete,
}: {
  data: Array<Email>
  canEdit: boolean
  onDelete: (id: number) => void
}) {
  const columns = useMemo(
    () => (canEdit ? [...dataColumns, buildActionsColumn(onDelete)] : dataColumns),
    [canEdit, onDelete],
  )

  return (
    <DataTable
      tableId="emails"
      columns={columns}
      data={data}
      searchPlaceholder="Search emails..."
      initialSorting={SORT_BY_NAME}
    />
  )
}
