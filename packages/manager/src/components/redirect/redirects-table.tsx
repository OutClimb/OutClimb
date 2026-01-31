'use client'

import { Button } from '@/components/ui/button'
import type { Redirect } from '@/types/redirect'
import { SquareArrowOutUpRight } from 'lucide-react'
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
  const dateFormatter = new Intl.DateTimeFormat(undefined, {
    dateStyle: 'full',
    timeStyle: 'short',
  })

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
            {canEdit && <TableHead className="text-right">Actions</TableHead>}
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
              <TableCell>{item.startsOn === 0 ? '-' : dateFormatter.format(new Date(item.startsOn))}</TableCell>
              <TableCell>{item.stopsOn === 0 ? '-' : dateFormatter.format(new Date(item.stopsOn))}</TableCell>
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
