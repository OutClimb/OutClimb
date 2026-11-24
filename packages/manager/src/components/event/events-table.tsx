'use client'

import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { formatDateTime } from '@/lib/timezone'
import { RowActions } from '@/components/row-actions'
import { Link } from '@tanstack/react-router'
import { Pencil, Trash2 } from 'lucide-react'
import type { Event } from '@/types/event'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export function EventsTable({
  data,
  canDelete,
  canEdit,
  onDelete,
}: {
  data: Array<Event>
  canDelete: boolean
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
            {(canDelete || canEdit) && (
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
              {(canDelete || canEdit) && (
                <TableCell>
                  <RowActions label={item.title}>
                    {canEdit && (
                      <DropdownMenuItem asChild>
                        <Link to="/manage/event/$id/edit" params={{ id: String(item.id) }}>
                          <Pencil />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {canDelete && canEdit && <DropdownMenuSeparator />}
                    {canDelete && (
                      <DropdownMenuItem variant="destructive" onSelect={handleDelete(item.id)}>
                        <Trash2 />
                        Delete
                      </DropdownMenuItem>
                    )}
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
