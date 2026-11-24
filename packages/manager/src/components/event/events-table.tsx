'use client'

import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { formatDateTime } from '@/lib/timezone'
import { RowActions } from '@/components/row-actions'
import { Trash2 } from 'lucide-react'
import type { Event } from '@/types/event'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export function EventsTable({
  data,
  canEdit,
  onDelete,
}: {
  data: Array<Event>
  canEdit: boolean
  onDelete: (id: number) => void
}) {
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
            <TableHead>Title</TableHead>
            <TableHead>Starts</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>City</TableHead>
            {canEdit && (
              <TableHead className="w-12">
                <span className="sr-only">Actions</span>
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.title}</TableCell>
              <TableCell>{formatDateTime(new Date(item.startsAt).getTime())}</TableCell>
              <TableCell>{item.locationName}</TableCell>
              <TableCell>{item.city}</TableCell>
              {canEdit && (
                <TableCell>
                  <RowActions label={item.title}>
                    <DropdownMenuItem variant="destructive" onSelect={handleDelete(item.id)}>
                      <Trash2 />
                      Delete
                    </DropdownMenuItem>
                  </RowActions>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
