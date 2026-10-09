'use client'

import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { RowActions } from '@/components/row-actions'
import { Copy, Pencil, Trash2 } from 'lucide-react'
import type { Form } from '@/types/form'
import { formatDateTime } from '@/lib/timezone'
import { Link } from '@tanstack/react-router'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export function FormsTable({
  data,
  canEdit,
  onDelete,
}: {
  data: Array<Form>
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
            <TableHead>Slug</TableHead>
            <TableHead>Opens On</TableHead>
            <TableHead>Closes On</TableHead>
            <TableHead>Max Submissions</TableHead>
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
                <Link
                  to="/manage/form/$id/submissions"
                  params={{ id: item.id.toString() }}
                  className="font-medium hover:text-primary hover:underline underline-offset-4">
                  {item.name}
                </Link>
              </TableCell>
              <TableCell>{item.slug}</TableCell>
              <TableCell>{!item.opensOn ? '-' : formatDateTime(item.opensOn)}</TableCell>
              <TableCell>{!item.closesOn ? '-' : formatDateTime(item.closesOn)}</TableCell>
              <TableCell>{!item.maxSubmissions ? 'Unlimited' : item.maxSubmissions}</TableCell>
              {canEdit && (
                <TableCell>
                  <RowActions label={item.name}>
                    <DropdownMenuItem asChild>
                      <Link to="/manage/form/$id/edit" params={{ id: item.slug }}>
                        <Pencil />
                        Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/manage/form/$id/duplicate" params={{ id: item.slug }}>
                        <Copy />
                        Duplicate
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
