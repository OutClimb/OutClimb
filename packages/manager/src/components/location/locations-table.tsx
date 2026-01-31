'use client'

import { Button } from '@/components/ui/button'
import type { Location } from '@/types/location'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export function LocationsTable({
  data,
  canEdit,
  onEdit,
  onDelete,
}: {
  data: Array<Location>
  canEdit: boolean
  onEdit: (id: number) => void
  onDelete: (id: number) => void
}) {
  const handleEdit = (id: number) => {
    return () => {
      onEdit(id)
    }
  }

  const handleDelete = (id: number) => {
    return () => {
      onDelete(id)
    }
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Normal Start Time</TableHead>
            <TableHead>Normal End Time</TableHead>
            {canEdit && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.name}</TableCell>
              <TableCell>{item.address.replaceAll('\n', ', ')}</TableCell>
              <TableCell>{item.startTime}</TableCell>
              <TableCell>{item.endTime}</TableCell>
              {canEdit && (
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" onClick={handleEdit(item.id)}>
                      Edit
                    </Button>
                    <Button variant="destructive" onClick={handleDelete(item.id)}>
                      Delete
                    </Button>
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
