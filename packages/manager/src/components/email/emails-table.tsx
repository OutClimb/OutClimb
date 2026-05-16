'use client'

import { Button } from '@/components/ui/button'
import type { Email } from '@/types/email'
import { Link } from '@tanstack/react-router'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export function EmailsTable({
  data,
  canEdit,
  onDelete,
}: {
  data: Array<Email>
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
            <TableHead>Subject</TableHead>
            {canEdit && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.id}>
              <TableCell><Link to="/manage/form/$id/submissions" params={{ id: item.id.toString() }}>{item.name}</Link></TableCell>
              <TableCell>{item.slug}</TableCell>
              <TableCell>{item.subject}</TableCell>
              {canEdit && (
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button asChild variant="secondary">
                      <Link to="/manage/email/$id/edit" params={{ id: item.id.toString() }}>
                          Edit
                      </Link>
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
