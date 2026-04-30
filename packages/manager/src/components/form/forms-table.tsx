'use client'

import { Button } from '@/components/ui/button'
import type { Form } from '@/types/form'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Link, useNavigate } from '@tanstack/react-router'

export function FormsTable({
  data,
  canEdit,
  onDelete,
}: {
  data: Array<Form>
  canEdit: boolean
  onDelete: (id: number) => void
}) {
  const navigate = useNavigate()
  const dateFormatter = new Intl.DateTimeFormat(undefined, {
    dateStyle: 'full',
    timeStyle: 'short',
  })

  // const handleDeleteDialogOpenChange = useCallback(() => {
  //   setSelectedId(null)
  //   setIsDeleteDialogOpen(false)
  // }, [setSelectedId, setIsDeleteDialogOpen])

  const handleEdit = (id: number) => {
    return () => {
      navigate({
        to: "/manage/form/$id/edit",
        params: { id: id.toString() }
      })
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
              <TableCell>{!item.opensOn ? '-' : dateFormatter.format(new Date(item.opensOn))}</TableCell>
              <TableCell>{!item.closesOn ? '-' : dateFormatter.format(new Date(item.closesOn))}</TableCell>
              <TableCell>{item.maxSubmissions}</TableCell>
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
