'use client'

import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { RowActions } from '@/components/row-actions'
import { Pencil, Trash2 } from 'lucide-react'
import { NAVIGATION_ITEMS } from '@/lib/navigation-items'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Role } from '@/types/role'
import useRoleStore from '@/stores/role'
import useSelfStore, { READ_PERMISSION, WRITE_PERMISSION } from '@/stores/self'

interface RolesTableProps {
  data: Array<Role>
  canEdit: boolean
  onEdit: (id: number) => void
  onDelete: (id: number) => void
}

export function RolesTable({ data, canEdit, onEdit, onDelete }: RolesTableProps) {
  const { user: getUser } = useSelfStore()
  const { list: listRoles } = useRoleStore()

  const roles = listRoles()
  const selfUser = getUser()
  const actorRole = roles.find((role) => role.name === selfUser?.role)

  const canActOn = (targetOrder: number) => {
    if (actorRole === undefined) {
      return false
    }

    if (actorRole.order === 0) {
      return true
    }

    return targetOrder > actorRole.order
  }

  const sorted = [...data].sort((a, b) => a.order - b.order)

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Hierarchy</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Can Read...</TableHead>
            <TableHead>Can Write...</TableHead>
            <TableHead>Two-Factor</TableHead>
            {canEdit && (
              <TableHead className="w-12">
                <span className="sr-only">Actions</span>
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((item) => {
            const allowAction = canActOn(item.order)
            const readEntities = NAVIGATION_ITEMS.filter(
              (nav) => (item.permissions[nav.entity] ?? 0) >= READ_PERMISSION,
            )
              .map((nav) => nav.title)
              .join(', ')
            const writeEntities = NAVIGATION_ITEMS.filter(
              (nav) => (item.permissions[nav.entity] ?? 0) === WRITE_PERMISSION,
            )
              .map((nav) => nav.title)
              .join(', ')
            return (
              <TableRow key={item.id}>
                <TableCell>#{item.order}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>{readEntities}</TableCell>
                <TableCell>{writeEntities}</TableCell>
                <TableCell>{item.requireTwoFactor ? 'Required' : 'Optional'}</TableCell>
                {canEdit && (
                  <TableCell>
                    {allowAction && (
                      <RowActions label={item.name}>
                        <DropdownMenuItem onSelect={() => onEdit(item.id)}>
                          <Pencil />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onSelect={() => onDelete(item.id)}>
                          <Trash2 />
                          Delete
                        </DropdownMenuItem>
                      </RowActions>
                    )}
                  </TableCell>
                )}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
