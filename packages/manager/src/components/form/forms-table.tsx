'use client'

import { Button } from '@/components/ui/button'
import type { Form } from '@/types/form'
import { format } from 'date-fns'
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
            {canEdit && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.id}>
              <TableCell><Link to="/manage/form/$id/submissions" params={{ id: item.id.toString() }}>{item.name}</Link></TableCell>
              <TableCell>{item.slug}</TableCell>
              <TableCell>{!item.opensOn ? '-' : format(item.opensOn, "EEEE, MMMM d, yyyy 'at' h:mm aa")}</TableCell>
              <TableCell>{!item.closesOn ? '-' : format(item.closesOn, "EEEE, MMMM d, yyyy 'at' h:mm aa")}</TableCell>
              <TableCell>{!item.maxSubmissions ? 'Unlimited' : item.maxSubmissions}</TableCell>
              {canEdit && (
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button asChild variant="secondary">
                      <Link to="/manage/form/$id/edit" params={{ id: item.slug }}>
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
