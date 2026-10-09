'use client'

import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { RowActions } from '@/components/row-actions'
import { formatDateTime } from '@/lib/timezone'
import type { Redirect } from '@/types/redirect'
import { Pencil, SquareArrowOutUpRight, Trash2 } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export function RedirectsTable({
  data,
  canEdit,
  onEdit,
  onDelete,
}: {
  data: Array<Redirect>
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

  const getLink = (fromPath: string) => {
    if (import.meta.env.MODE === 'dev') {
      return `http://outclimb.local/b/${fromPath}`
    } else {
      return `https://outcl.im/b/${fromPath}`
    }
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>From</TableHead>
            <TableHead>To</TableHead>
            <TableHead>Starts On</TableHead>
            <TableHead>Ends On</TableHead>
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
              <TableCell>
                <a href={getLink(item.fromPath)} target="_blank" className="group hover:underline">
                  {item.fromPath} <SquareArrowOutUpRight className="size-3 inline invisible group-hover:visible" />
                </a>
              </TableCell>
              <TableCell>
                <a href={item.toUrl} target="_blank" className="group hover:underline">
                  {item.toUrl} <SquareArrowOutUpRight className="size-3 inline invisible group-hover:visible" />
                </a>
              </TableCell>
              <TableCell>{item.startsOn === 0 ? '-' : formatDateTime(item.startsOn)}</TableCell>
              <TableCell>{item.stopsOn === 0 ? '-' : formatDateTime(item.stopsOn)}</TableCell>
              {canEdit && (
                <TableCell>
                  <RowActions label={item.fromPath}>
                    <DropdownMenuItem onSelect={handleEdit(item.id)}>
                      <Pencil />
                      Edit
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
