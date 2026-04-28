'use client'

import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { User } from '@/types/user'
import useRoleStore from '@/stores/role'
import useSelfStore from '@/stores/self'

interface UsersTableProps {
  data: Array<User>
  canEdit: boolean
  onEdit: (id: number) => void
  onDelete: (id: number) => void
}

export function UsersTable({ data, canEdit, onEdit, onDelete }: UsersTableProps) {
  const { user: getUser } = useSelfStore()
  const { list: listRoles } = useRoleStore()

  const roles = listRoles()
  const selfUser = getUser()
  const actorRole = roles.find((role) => role.name === selfUser?.role)
  const roleOrderByName = roles.reduce<Record<string, number>>((acc, role) => {
    acc[role.name] = role.order
    return acc
  }, {})

  const canActOn = (targetRole: string) => {
    if (actorRole === undefined) {
      return false
    }

    if (actorRole.order === 0) {
      return true
    }

    const targetOrder = roleOrderByName[targetRole]
    if (targetOrder === undefined) {
      return false
    }

    return targetOrder >= actorRole.order
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Username</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            {canEdit && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => {
            const allowAction = canActOn(item.role)
            return (
              <TableRow key={item.id}>
                <TableCell>{item.username}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.email}</TableCell>
                <TableCell>{item.role}</TableCell>
                {canEdit && (
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      {(allowAction || item.id === selfUser?.id) && (
                        <Button variant="secondary" onClick={() => onEdit(item.id)}>
                          Edit
                        </Button>
                      )}
                      {allowAction && item.id !== selfUser?.id && (
                        <Button variant="destructive" onClick={() => onDelete(item.id)}>
                          Delete
                        </Button>
                      )}
                    </div>
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
