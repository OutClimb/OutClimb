'use client'

import authGuard from '@/lib/auth-guard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Content } from '@/components/content'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { downloadCsv } from '@/lib/csv'
import { Download, FileText, Inbox, Pencil } from 'lucide-react'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { fetchForm, fetchSubmissions } from '@/api/form'
import { formatDateTime } from '@/lib/timezone'
import { FormViewersCard } from '@/components/form/form-viewers-card'
import { getPublicFormLink } from '@/lib/form-link'
import { getSubmissionValue } from '@/lib/submission'
import { Header } from '@/components/header'
import permissionGuard from '@/lib/permission-guard'
import { Spinner } from '@/components/ui/spinner'
import { SubmissionsTable } from '@/components/form/submissions-table'
import { UnauthorizedError } from '@/errors/unauthorized'
import { useEffect, useState, type ReactNode } from 'react'
import useFormStore from '@/stores/form'
import useSelfStore, { READ_PERMISSION, WRITE_PERMISSION } from '@/stores/self'
import type { Form, Submission } from '@/types/form'

export const Route = createFileRoute('/manage_/form_/$id/')({
  component: FormDetails,
  head: () => ({
    meta: [{ title: 'Form | OutClimb Management' }],
  }),
  beforeLoad: ({ context, location }) =>
    Promise.all([authGuard(context, location), permissionGuard(context, 'form', READ_PERMISSION)]),
})

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="break-words">{children}</dd>
    </div>
  )
}

function FormDetails() {
  const { id: slug } = Route.useParams()
  const navigate = useNavigate()
  const { hasPermission, token } = useSelfStore()
  const { populateSingle } = useFormStore()

  const [form, setForm] = useState<Form | null>(null)
  const [submissions, setSubmissions] = useState<Array<Submission>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const canEdit = hasPermission('form', WRITE_PERMISSION)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const fetched = await fetchForm(token ?? '', slug)

        // Users without access to this form get the public view, which has no viewableBy
        if (!fetched.viewableBy) {
          return
        }

        setSubmissions(await fetchSubmissions(token ?? '', fetched.id))
        populateSingle(fetched)
        setForm(fetched)
      } catch (error) {
        if (error instanceof UnauthorizedError) {
          navigate({ to: '/manage/login' })
        }
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [slug, token, populateSingle, navigate])

  const fields = [...(form?.fields ?? [])].sort((a, b) => a.order - b.order)

  const handleExport = () => {
    if (!form) return

    downloadCsv(`${form.slug}-submissions.csv`, [
      ['Submitted On', ...fields.map((field) => field.name)],
      ...submissions.map((submission) => [
        formatDateTime(submission.submittedOn),
        ...fields.map((field) => getSubmissionValue(submission, field)),
      ]),
    ])
  }

  const handleViewersSave = (updated: Form) => {
    populateSingle(updated)
    setForm(updated)
  }

  return (
    <>
      <Header
        isLoading={isLoading || isSaving}
        backTo="/manage/form"
        actions={
          form && (
            <>
              <Button variant="outline" onClick={handleExport} disabled={submissions.length === 0}>
                <Download />
                Export CSV
              </Button>
              {canEdit && (
                <Button asChild>
                  <Link to="/manage/form/$id/edit" params={{ id: form.slug }}>
                    <Pencil />
                    Edit
                  </Link>
                </Button>
              )}
            </>
          )
        }>
        {form?.name ?? 'Form'}
      </Header>

      <Content className="flex flex-col gap-6">
        {isLoading && (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Spinner />
              </EmptyMedia>
              <EmptyTitle>Loading...</EmptyTitle>
            </EmptyHeader>
          </Empty>
        )}

        {!isLoading && !form && (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileText />
              </EmptyMedia>
              <EmptyTitle>Form not found</EmptyTitle>
            </EmptyHeader>
          </Empty>
        )}

        {form && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Detail label="Link">
                    <a
                      href={getPublicFormLink(form.slug)}
                      target="_blank"
                      className="hover:text-primary hover:underline underline-offset-4">
                      {form.slug}
                    </a>
                  </Detail>
                  <Detail label="Opens On">{form.opensOn ? formatDateTime(form.opensOn) : '-'}</Detail>
                  <Detail label="Closes On">{form.closesOn ? formatDateTime(form.closesOn) : '-'}</Detail>
                  <Detail label="Submissions">
                    {submissions.length}
                    {form.maxSubmissions ? ` of ${form.maxSubmissions}` : ''}
                  </Detail>
                  <Detail label="Confirmation Email">{form.confirmationEmailSlug || '-'}</Detail>
                  <Detail label="Notification Email">
                    {form.notificationEmailSlug && form.notificationEmailTo
                      ? `${form.notificationEmailSlug} to ${form.notificationEmailTo}`
                      : '-'}
                  </Detail>
                </dl>
              </CardContent>
            </Card>

            {canEdit && <FormViewersCard form={form} onSave={handleViewersSave} onSavingChange={setIsSaving} />}

            <Card className="pb-0">
              <CardHeader>
                <CardTitle>Submissions</CardTitle>
                <CardDescription>Everything people have submitted through this form</CardDescription>
              </CardHeader>
              <CardContent className="px-0">
                {submissions.length === 0 ? (
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <Inbox />
                      </EmptyMedia>
                      <EmptyTitle>No submissions yet</EmptyTitle>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  <SubmissionsTable fields={fields} data={submissions} />
                )}
              </CardContent>
            </Card>
          </>
        )}
      </Content>
    </>
  )
}
