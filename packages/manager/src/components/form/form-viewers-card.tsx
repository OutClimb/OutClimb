'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { fetchFormViewers, updateFormViewableBy } from '@/api/form'
import { Spinner } from '@/components/ui/spinner'
import { Switch } from '@/components/ui/switch'
import { UnauthorizedError } from '@/errors/unauthorized'
import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import useSelfStore from '@/stores/self'
import type { Form, FormViewer } from '@/types/form'

export function FormViewersCard({
  form,
  onSave,
  onSavingChange,
}: {
  form: Form
  onSave: (form: Form) => void
  onSavingChange: (isSaving: boolean) => void
}) {
  const navigate = useNavigate()
  const { token } = useSelfStore()

  const [viewers, setViewers] = useState<Array<FormViewer>>([])
  const [selected, setSelected] = useState<Array<number>>(form.viewableBy)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        setViewers(await fetchFormViewers(token ?? ''))
      } catch (error) {
        if (error instanceof UnauthorizedError) {
          navigate({ to: '/manage/login' })
        } else {
          setError('Unable to load users. Please try again.')
        }
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [token, navigate])

  const handleCheckedChange = (id: number) => async (checked: boolean) => {
    const previous = selected
    const next = checked ? [...previous, id] : previous.filter((viewerId) => viewerId !== id)

    setSelected(next)
    setIsSaving(true)
    onSavingChange(true)
    setError(null)
    try {
      const updated = await updateFormViewableBy(token ?? '', form.id, next)
      setSelected(updated.viewableBy)
      onSave(updated)
    } catch (error) {
      setSelected(previous)
      if (error instanceof UnauthorizedError) {
        navigate({ to: '/manage/login' })
      } else {
        setError(error instanceof Error ? error.message : 'An error occurred. Please try again.')
      }
    } finally {
      setIsSaving(false)
      onSavingChange(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Viewers</CardTitle>
        <CardDescription>
          Users with read-only access to forms who can see this form and its submissions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && <Spinner />}

        {!isLoading && viewers.length === 0 && (
          <p className="text-sm text-muted-foreground">No users have read-only access to forms</p>
        )}

        {!isLoading && viewers.length > 0 && (
          <FieldGroup className="gap-3">
            {viewers.map((viewer) => (
              <Field key={viewer.id} orientation="horizontal">
                <FieldLabel htmlFor={`viewer-${viewer.id}`} className="font-normal">
                  {viewer.name}
                  <span className="text-muted-foreground">{viewer.username}</span>
                </FieldLabel>
                <Switch
                  id={`viewer-${viewer.id}`}
                  checked={selected.includes(viewer.id)}
                  disabled={isSaving}
                  onCheckedChange={handleCheckedChange(viewer.id)}
                />
              </Field>
            ))}
          </FieldGroup>
        )}

        {error && <FieldError className="mt-3">{error}</FieldError>}
      </CardContent>
    </Card>
  )
}
