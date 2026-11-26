'use client'

import { ACTIONS_COLUMN_ID, type DataTableFeatures } from '@/components/data-table/data-table-features'
import { createColumnHelper, type SortingState } from '@tanstack/react-table'
import { DataTable } from '@/components/data-table/data-table'
import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { NAVIGATION_ITEMS } from '@/lib/navigation-items'
import { Pencil, Trash2 } from 'lucide-react'
import type { Role } from '@/types/role'
import { RowActions } from '@/components/row-actions'
import { useMemo } from 'react'
import useRoleStore from '@/stores/role'
import useSelfStore, { READ_PERMISSION, WRITE_PERMISSION } from '@/stores/self'

interface RolesTableProps {
  data: Array<Role>
  canEdit: boolean
  onEdit: (id: number) => void
  onDelete: (id: number) => void
}

const columnHelper = createColumnHelper<DataTableFeatures, Role>()

const SORT_BY_HIERARCHY: SortingState = [{ id: 'order', desc: false }]

function listEntitiesWithPermission(role: Role, hasPermission: (level: number) => boolean) {
  return NAVIGATION_ITEMS.filter((nav) => hasPermission(role.permissions[nav.entity] ?? 0))
    .map((nav) => nav.title)
    .join(', ')
}

const dataColumns = columnHelper.columns([
  columnHelper.accessor('order', { header: 'Hierarchy', cell: ({ getValue }) => `#${getValue()}` }),
  columnHelper.accessor('name', { header: 'Name' }),
  columnHelper.accessor((item) => listEntitiesWithPermission(item, (level) => level >= READ_PERMISSION), {
    id: 'canRead',
    header: 'Can Read...',
  }),
  columnHelper.accessor((item) => listEntitiesWithPermission(item, (level) => level === WRITE_PERMISSION), {
    id: 'canWrite',
    header: 'Can Write...',
  }),
  columnHelper.accessor((item) => (item.requireTwoFactor ? 'Required' : 'Optional'), {
    id: 'twoFactor',
    header: 'Two-Factor',
  }),
])

function canActOnRole(actorRole: Role | undefined, targetOrder: number) {
  if (actorRole === undefined) {
    return false
  }

  if (actorRole.order === 0) {
    return true
  }

  return targetOrder > actorRole.order
}

function buildActionsColumn(actorRole: Role | undefined, onEdit: (id: number) => void, onDelete: (id: number) => void) {
  return columnHelper.display({
    id: ACTIONS_COLUMN_ID,
    header: () => <span className="sr-only">Actions</span>,
    enableHiding: false,
    cell: ({ row }) =>
      canActOnRole(actorRole, row.original.order) && (
        <RowActions label={row.original.name}>
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

export function RolesTable({ data, canEdit, onEdit, onDelete }: RolesTableProps) {
  const { user: getUser } = useSelfStore()
  const { list: listRoles } = useRoleStore()

  const selfUser = getUser()
  const actorRole = listRoles().find((role) => role.name === selfUser?.role)

  const columns = useMemo(
    () => (canEdit ? [...dataColumns, buildActionsColumn(actorRole, onEdit, onDelete)] : dataColumns),
    [canEdit, actorRole, onEdit, onDelete],
  )

  return (
    <DataTable
      tableId="roles"
      columns={columns}
      data={data}
      searchPlaceholder="Search roles..."
      initialSorting={SORT_BY_HIERARCHY}
    />
  )
}
