'use client'

import { ACTIONS_COLUMN_ID, type DataTableFeatures } from '@/components/data-table/data-table-features'
import { Copy, Pencil, SquareArrowOutUpRight, Trash2 } from 'lucide-react'
import { createColumnHelper } from '@tanstack/react-table'
import { DataTable } from '@/components/data-table/data-table'
import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { formatDateTime } from '@/lib/timezone'
import type { Redirect } from '@/types/redirect'
import { RowActions } from '@/components/row-actions'
import { useMemo } from 'react'

const columnHelper = createColumnHelper<DataTableFeatures, Redirect>()

const NO_TIMESTAMP = 0

function getLink(fromPath: string) {
  if (import.meta.env.MODE === 'dev') {
    return `http://outclimb.local/b/${fromPath}`
  } else {
    return `https://outcl.im/b/${fromPath}`
  }
}

function getOptionalTimestamp(timestamp: number) {
  return timestamp === NO_TIMESTAMP ? undefined : timestamp
}

function formatOptionalDateTime(timestamp: number | undefined) {
  return timestamp === undefined ? '-' : formatDateTime(timestamp)
}

function ExternalLink({ href, children }: { href: string; children: string }) {
  return (
    <a href={href} target="_blank" className="group hover:underline">
      {children} <SquareArrowOutUpRight className="size-3 inline invisible group-hover:visible" />
    </a>
  )
}

const dataColumns = columnHelper.columns([
  columnHelper.accessor('fromPath', {
    header: 'From',
    cell: ({ getValue }) => <ExternalLink href={getLink(getValue())}>{getValue()}</ExternalLink>,
  }),
  columnHelper.accessor('toUrl', {
    header: 'To',
    cell: ({ getValue }) => <ExternalLink href={getValue()}>{getValue()}</ExternalLink>,
  }),
  columnHelper.accessor((item) => getOptionalTimestamp(item.startsOn), {
    id: 'startsOn',
    header: 'Starts On',
    enableGlobalFilter: false,
    sortUndefined: 'last',
    cell: ({ getValue }) => formatOptionalDateTime(getValue()),
  }),
  columnHelper.accessor((item) => getOptionalTimestamp(item.stopsOn), {
    id: 'stopsOn',
    header: 'Ends On',
    enableGlobalFilter: false,
    sortUndefined: 'last',
    cell: ({ getValue }) => formatOptionalDateTime(getValue()),
  }),
])

function buildActionsColumn(
  onEdit: (id: number) => void,
  onDuplicate: (id: number) => void,
  onDelete: (id: number) => void,
) {
  return columnHelper.display({
    id: ACTIONS_COLUMN_ID,
    header: () => <span className="sr-only">Actions</span>,
    enableHiding: false,
    cell: ({ row }) => (
      <RowActions label={row.original.fromPath}>
        <DropdownMenuItem onSelect={() => onEdit(row.original.id)}>
          <Pencil />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onDuplicate(row.original.id)}>
          <Copy />
          Duplicate
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

export function RedirectsTable({
  data,
  canEdit,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  data: Array<Redirect>
  canEdit: boolean
  onEdit: (id: number) => void
  onDuplicate: (id: number) => void
  onDelete: (id: number) => void
}) {
  const columns = useMemo(
    () => (canEdit ? [...dataColumns, buildActionsColumn(onEdit, onDuplicate, onDelete)] : dataColumns),
    [canEdit, onEdit, onDuplicate, onDelete],
  )

  return <DataTable tableId="redirects" columns={columns} data={data} searchPlaceholder="Search redirects..." />
}
