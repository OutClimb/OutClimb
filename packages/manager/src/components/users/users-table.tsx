'use client'

import { ACTIONS_COLUMN_ID, type DataTableFeatures } from '@/components/data-table/data-table-features'
import { createColumnHelper, type SortingState } from '@tanstack/react-table'
import { DataTable } from '@/components/data-table/data-table'
import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Pencil, Trash2 } from 'lucide-react'
import type { Role } from '@/types/role'
import { RowActions } from '@/components/row-actions'
import { useMemo } from 'react'
import type { User } from '@/types/user'
import useRoleStore from '@/stores/role'
import useSelfStore from '@/stores/self'

interface UsersTableProps {
  data: Array<User>
  canEdit: boolean
  onEdit: (id: number) => void
  onDelete: (id: number) => void
}

const columnHelper = createColumnHelper<DataTableFeatures, User>()

const SORT_BY_USERNAME: SortingState = [{ id: 'username', desc: false }]

const dataColumns = columnHelper.columns([
  columnHelper.accessor('username', { header: 'Username' }),
  columnHelper.accessor('name', { header: 'Name' }),
  columnHelper.accessor('email', { header: 'Email' }),
  columnHelper.accessor('role', { header: 'Role' }),
])

function canActOnUser(actorRole: Role | undefined, roles: Array<Role>, targetRoleName: string) {
  if (actorRole === undefined) {
    return false
  }

  if (actorRole.order === 0) {
    return true
  }

  const targetRole = roles.find((role) => role.name === targetRoleName)
  if (targetRole === undefined) {
    return false
  }

  return targetRole.order >= actorRole.order
}

function buildActionsColumn(
  actorRole: Role | undefined,
  roles: Array<Role>,
  selfUserId: number | undefined,
  onEdit: (id: number) => void,
  onDelete: (id: number) => void,
) {
  return columnHelper.display({
    id: ACTIONS_COLUMN_ID,
    header: () => <span className="sr-only">Actions</span>,
    enableHiding: false,
    cell: ({ row }) => {
      const item = row.original
      const allowAction = canActOnUser(actorRole, roles, item.role)
      const isSelf = item.id === selfUserId

      if (!allowAction && !isSelf) {
        return null
      }

      return (
        <RowActions label={item.username}>
          <DropdownMenuItem onSelect={() => onEdit(item.id)}>
            <Pencil />
            Edit
          </DropdownMenuItem>
          {allowAction && !isSelf && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => onDelete(item.id)}>
                <Trash2 />
                Delete
              </DropdownMenuItem>
            </>
          )}
        </RowActions>
      )
    },
  })
}

export function UsersTable({ data, canEdit, onEdit, onDelete }: UsersTableProps) {
  const { user: getUser } = useSelfStore()
  const { list: listRoles } = useRoleStore()

  const roles = listRoles()
  const selfUser = getUser()
  const actorRole = roles.find((role) => role.name === selfUser?.role)
  const selfUserId = selfUser?.id

  const columns = useMemo(
    () =>
      canEdit ? [...dataColumns, buildActionsColumn(actorRole, roles, selfUserId, onEdit, onDelete)] : dataColumns,
    [canEdit, actorRole, roles, selfUserId, onEdit, onDelete],
  )

  return (
    <DataTable
      tableId="users"
      columns={columns}
      data={data}
      searchPlaceholder="Search users..."
      initialSorting={SORT_BY_USERNAME}
    />
  )
}
