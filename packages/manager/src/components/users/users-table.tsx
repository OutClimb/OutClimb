'use client'

import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { User } from '@/types/user'

interface UsersTableProps {
  data: Array<User>
  canEdit: boolean
  onEdit: (id: number) => void
  onDelete: (id: number) => void
}

export function UsersTable({ data, canEdit, onEdit, onDelete }: UsersTableProps) {
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
          {data.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.username}</TableCell>
              <TableCell>{item.name}</TableCell>
              <TableCell>{item.email}</TableCell>
              <TableCell>{item.role}</TableCell>
              {canEdit && (
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" onClick={() => onEdit(item.id)}>
                      Edit
                    </Button>
                    {item.role !== 'Owner' && (
                      <Button variant="destructive" onClick={() => onDelete(item.id)}>
                        Delete
                      </Button>
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
