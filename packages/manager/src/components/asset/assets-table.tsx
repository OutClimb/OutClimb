'use client'

import { Button } from '@/components/ui/button'
import type { Asset } from '@/types/asset'
import { SquareArrowOutUpRight } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export function AssetsTable({
  data,
  onEdit,
  onDelete,
}: {
  data: Array<Asset>
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

  const getLink = (fileName: string) => {
    if (import.meta.env.MODE === 'dev') {
      return `http://assets.outclimb.local/q/${fileName}`
    } else {
      return `https://assets.outclimb.gay/q/${fileName}`
    }
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>File</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <a href={getLink(item.fileName)} target="_blank" className="group hover:underline">
                  {item.fileName} <SquareArrowOutUpRight className="size-3 inline invisible group-hover:visible" />
                </a>
              </TableCell>
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
