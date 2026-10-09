'use client'

import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { RowActions } from '@/components/row-actions'
import type { Asset } from '@/types/asset'
import { Pencil, SquareArrowOutUpRight, Trash2 } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export function AssetsTable({
  data,
  canEdit,
  onEdit,
  onDelete,
}: {
  data: Array<Asset>
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
              <TableCell className="h-12">
                <a href={getLink(item.fileName)} target="_blank" className="group hover:underline">
                  {item.fileName} <SquareArrowOutUpRight className="size-3 inline invisible group-hover:visible" />
                </a>
              </TableCell>
              {canEdit && (
                <TableCell>
                  <RowActions label={item.fileName}>
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
