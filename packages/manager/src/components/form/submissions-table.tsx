'use client'

import type { FormField, Submission } from '@/types/form'
import { formatDateTime } from '@/lib/timezone'
import { getSubmissionValue } from '@/lib/submission'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export function SubmissionsTable({ fields, data }: { fields: Array<FormField>; data: Array<Submission> }) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Submitted On</TableHead>
            {fields.map((field) => (
              <TableHead key={field.id}>{field.name}</TableHead>
            ))}
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
