'use client'

import authGuard from '@/lib/auth-guard'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Content } from '@/components/content'
import { DonationsTable } from '@/components/donation/donations-table'
import { downloadCsv } from '@/lib/csv'
import { Download, HandHeart } from 'lucide-react'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { fetchDonations } from '@/api/donation'
import { formatDateTime } from '@/lib/timezone'
import { formatDonationAmountPlain } from '@/lib/donation'
import { Header } from '@/components/header'
import permissionGuard from '@/lib/permission-guard'
import { Spinner } from '@/components/ui/spinner'
import { UnauthorizedError } from '@/errors/unauthorized'
import { useEffect, useState } from 'react'
import useDonationStore from '@/stores/donation'
import useSelfStore, { READ_PERMISSION } from '@/stores/self'

export const Route = createFileRoute('/manage_/donation')({
  component: Donations,
  head: () => ({
    meta: [
      {
        title: 'Donations | OutClimb Management',
      },
    ],
  }),
  beforeLoad: ({ context, location }) =>
    Promise.all([authGuard(context, location), permissionGuard(context, 'donation', READ_PERMISSION)]),
})

function Donations() {
  const navigate = useNavigate()
  const { token } = useSelfStore()
  const { isEmpty, list, populate } = useDonationStore()

  const [isHydrated, setIsHydrated] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  useEffect(() => {
    const fetchDonationsFromApi = async () => {
      setIsLoading(true)

      try {
        const donations = await fetchDonations(token || '')
        populate(donations)
      } catch (error) {
        if (error instanceof UnauthorizedError) {
          navigate({ to: '/manage/login' })
        }
      } finally {
        setIsHydrated(true)
        setIsLoading(false)
      }
    }

    if (!isHydrated) {
      fetchDonationsFromApi()
    }
  })

  const donationsNewestFirst = list().sort((a, b) => b.createdAt - a.createdAt)

  const handleExport = () => {
    downloadCsv('donations.csv', [
      ['Date', 'Donor', 'Email', 'Amount', 'Currency', 'Status'],
      ...donationsNewestFirst.map((donation) => [
        formatDateTime(donation.completedAt ?? donation.createdAt),
        donation.donorName,
        donation.donorEmail,
        formatDonationAmountPlain(donation.amountCents),
        donation.currency.toUpperCase(),
        donation.status,
      ]),
    ])
  }

  return (
    <>
      <Header
        isLoading={isLoading}
        actions={
          <Button variant="outline" onClick={handleExport} disabled={isLoading || isEmpty()}>
            <Download />
            Export CSV
          </Button>
        }>
        Donations
      </Header>

      <Content>
        <Card className="p-0">
          <CardContent className="p-0">
            {isLoading && (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Spinner />
                  </EmptyMedia>
                  <EmptyTitle>Loading donations...</EmptyTitle>
                </EmptyHeader>
              </Empty>
            )}

            {!isLoading && isEmpty() && (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <HandHeart />
                  </EmptyMedia>
                  <EmptyTitle>No donations yet</EmptyTitle>
                </EmptyHeader>
              </Empty>
            )}

            {!isLoading && !isEmpty() && <DonationsTable data={donationsNewestFirst} />}
          </CardContent>
        </Card>
      </Content>
    </>
  )
}
