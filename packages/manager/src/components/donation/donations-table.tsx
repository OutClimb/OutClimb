'use client'

import type { Donation } from '@/types/donation'
import { formatDateTime } from '@/lib/timezone'
import { formatDonationAmount } from '@/lib/donation'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export function DonationsTable({ data }: { data: Array<Donation> }) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Donor</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{formatDateTime(item.completedAt ?? item.createdAt)}</TableCell>
              <TableCell>{item.donorName || '-'}</TableCell>
              <TableCell>{item.donorEmail || '-'}</TableCell>
              <TableCell>{formatDonationAmount(item.amountCents, item.currency)}</TableCell>
              <TableCell className="capitalize">{item.status}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
