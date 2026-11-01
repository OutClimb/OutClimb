'use client'

import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import type { FormField, Submission } from '@/types/form'
import { formatDateTime } from '@/lib/timezone'
import { getSubmissionValue } from '@/lib/submission'
import { Trash2 } from 'lucide-react'
import { RowActions } from '@/components/row-actions'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export function SubmissionsTable({
  fields,
  data,
  canEdit,
  onDelete,
}: {
  fields: Array<FormField>
  data: Array<Submission>
  canEdit: boolean
  onDelete: (id: number) => void
}) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Submitted On</TableHead>
            {fields.map((field) => (
              <TableHead key={field.id}>{field.name}</TableHead>
            ))}
            {canEdit && (
              <TableHead className="w-12">
                <span className="sr-only">Actions</span>
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((submission) => (
            <TableRow key={submission.id}>
              <TableCell>{formatDateTime(submission.submittedOn)}</TableCell>
              {fields.map((field) => (
                <TableCell key={field.id} className="max-w-xs truncate">
                  {getSubmissionValue(submission, field) || '-'}
                </TableCell>
              ))}
              {canEdit && (
                <TableCell>
                  <RowActions label={`submission from ${formatDateTime(submission.submittedOn)}`}>
                    <DropdownMenuItem variant="destructive" onSelect={() => onDelete(submission.id)}>
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
