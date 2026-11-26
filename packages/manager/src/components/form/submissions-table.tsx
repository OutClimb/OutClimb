'use client'

import { ACTIONS_COLUMN_ID, type DataTableFeatures } from '@/components/data-table/data-table-features'
import { createColumnHelper, type SortingState } from '@tanstack/react-table'
import { DataTable } from '@/components/data-table/data-table'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import type { FormField, Submission } from '@/types/form'
import { formatDateTime } from '@/lib/timezone'
import { getSubmissionValue } from '@/lib/submission'
import { RowActions } from '@/components/row-actions'
import { Trash2 } from 'lucide-react'
import { useMemo } from 'react'

const columnHelper = createColumnHelper<DataTableFeatures, Submission>()

const SORT_BY_NEWEST_SUBMISSION: SortingState = [{ id: 'submittedOn', desc: true }]

const submittedOnColumn = columnHelper.accessor('submittedOn', {
  header: 'Submitted On',
  enableGlobalFilter: false,
  cell: ({ getValue }) => formatDateTime(getValue()),
})

function buildFieldColumn(field: FormField) {
  return columnHelper.accessor((submission) => getSubmissionValue(submission, field), {
    id: `field-${field.id}`,
    header: field.name,
    meta: { cellClassName: 'max-w-xs truncate' },
    cell: ({ getValue }) => getValue() || '-',
  })
}

function buildActionsColumn(onDelete: (id: number) => void) {
  return columnHelper.display({
    id: ACTIONS_COLUMN_ID,
    header: () => <span className="sr-only">Actions</span>,
    enableHiding: false,
    cell: ({ row }) => (
      <RowActions label={`submission from ${formatDateTime(row.original.submittedOn)}`}>
        <DropdownMenuItem variant="destructive" onSelect={() => onDelete(row.original.id)}>
          <Trash2 />
          Delete
        </DropdownMenuItem>
      </RowActions>
    ),
  })
}

export function SubmissionsTable({
  formId,
  fields,
  data,
  canEdit,
  onDelete,
}: {
  formId: number
  fields: Array<FormField>
  data: Array<Submission>
  canEdit: boolean
  onDelete: (id: number) => void
}) {
  const columns = useMemo(() => {
    const dataColumns = columnHelper.columns([submittedOnColumn, ...fields.map(buildFieldColumn)])
    return canEdit ? [...dataColumns, buildActionsColumn(onDelete)] : dataColumns
  }, [fields, canEdit, onDelete])

  return (
    <DataTable
      tableId={`submissions:${formId}`}
      columns={columns}
      data={data}
      searchPlaceholder="Search submissions..."
      initialSorting={SORT_BY_NEWEST_SUBMISSION}
    />
  )
}
