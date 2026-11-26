'use client'

import { createColumnHelper, type SortingState } from '@tanstack/react-table'
import { DataTable } from '@/components/data-table/data-table'
import type { DataTableFeatures } from '@/components/data-table/data-table-features'
import type { Donation } from '@/types/donation'
import { formatDateTime } from '@/lib/timezone'
import { formatDonationAmount } from '@/lib/donation'

const columnHelper = createColumnHelper<DataTableFeatures, Donation>()

const SORT_BY_NEWEST_DATE: SortingState = [{ id: 'date', desc: true }]

const columns = columnHelper.columns([
  columnHelper.accessor((item) => item.completedAt ?? item.createdAt, {
    id: 'date',
    header: 'Date',
    enableGlobalFilter: false,
    cell: ({ getValue }) => formatDateTime(getValue()),
  }),
  columnHelper.accessor('donorName', { header: 'Donor', cell: ({ getValue }) => getValue() || '-' }),
  columnHelper.accessor('donorEmail', { header: 'Email', cell: ({ getValue }) => getValue() || '-' }),
  columnHelper.accessor('amountCents', {
    header: 'Amount',
    enableGlobalFilter: false,
    cell: ({ getValue, row }) => formatDonationAmount(getValue(), row.original.currency),
  }),
  columnHelper.accessor('status', { header: 'Status', meta: { cellClassName: 'capitalize' } }),
])

export function DonationsTable({ data }: { data: Array<Donation> }) {
  return (
    <DataTable
      tableId="donations"
      columns={columns}
      data={data}
      searchPlaceholder="Search donations..."
      initialSorting={SORT_BY_NEWEST_DATE}
    />
  )
}
