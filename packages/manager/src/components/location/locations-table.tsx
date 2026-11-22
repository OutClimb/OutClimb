'use client'

import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { RowActions } from '@/components/row-actions'
import { Pencil, Trash2 } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import type { Location } from '@/types/location'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export function LocationsTable({
  data,
  canEdit,
  onDelete,
}: {
  data: Array<Location>
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
            <TableHead>Name</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>City, State</TableHead>
            <TableHead>Normal Start Time</TableHead>
            <TableHead>Normal End Time</TableHead>
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
              <TableCell>{item.name}</TableCell>
              <TableCell>{item.address.replaceAll('\n', ', ')}</TableCell>
              <TableCell>{[item.city, item.state].filter(Boolean).join(', ')}</TableCell>
              <TableCell>{item.startTime}</TableCell>
              <TableCell>{item.endTime}</TableCell>
              {canEdit && (
                <TableCell>
                  <RowActions label={item.name}>
                    <DropdownMenuItem asChild>
                      <Link to="/manage/location/$id/edit" params={{ id: String(item.id) }}>
                        <Pencil />
                        Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
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
