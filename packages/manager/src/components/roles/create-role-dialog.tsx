'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createRole } from '@/api/role'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldLabel } from '../ui/field'
import { Input } from '@/components/ui/input'
import { NAVIGATION_ITEMS } from '@/lib/navigation-items'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UnauthorizedError } from '@/errors/unauthorized'
import { useCallback, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import useRoleStore from '@/stores/role'
import useSelfStore, { NO_PERMISSION, READ_PERMISSION, WRITE_PERMISSION } from '@/stores/self'

interface FormData {
  name: string
  order: string
  permissions: Record<string, number>
}

interface FormError {
  name: string
  order: string
}

const emptyPermissions = (): Record<string, number> =>
  NAVIGATION_ITEMS.reduce<Record<string, number>>((acc, item) => {
    acc[item.entity] = NO_PERMISSION
    return acc
  }, {})

const emptyFormData: FormData = {
  name: '',
  order: '',
  permissions: emptyPermissions(),
}

const emptyFormError: FormError = {
  name: '',
  order: '',
}

interface CreateRoleDialogProps {
  open: boolean
  onOpenChange: (isOpen: boolean) => void
}

export function CreateRoleDialog({ open, onOpenChange }: CreateRoleDialogProps) {
  const navigate = useNavigate()
  const { token, user: getUser } = useSelfStore()
  const { list: listRoles, populateSingle } = useRoleStore()

  const selfUser = getUser()
  const actorRole = listRoles().find((role) => role.name === selfUser?.role)
  const minOrder = actorRole === undefined ? Number.MAX_SAFE_INTEGER : actorRole.order

  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [formError, setFormError] = useState<FormError>(emptyFormError)
  const [formData, setFormData] = useState<FormData>(() => ({ ...emptyFormData, order: (minOrder + 1).toString(), permissions: emptyPermissions() }))

  if (
    !open &&
    (formData.name !== '' ||
      formData.order !== (minOrder + 1).toString() ||
      Object.values(formData.permissions).some((value) => value !== NO_PERMISSION))
  ) {
    setFormData({ ...emptyFormData, order: (minOrder + 1).toString(), permissions: emptyPermissions() })
    setFormError(emptyFormError)
  }

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }, [])

  const handlePermissionChange = useCallback((entity: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [entity]: Number(value),
      },
    }))
  }, [])

  const handleCancel = useCallback(() => {
    onOpenChange(false)
  }, [onOpenChange])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      let hasError = false
      const nextError: FormError = { ...emptyFormError }

      if (!formData.name.trim()) {
        hasError = true
        nextError.name = 'Please fill in this field'
      }

      const orderNumber = Number(formData.order)
      if (formData.order.trim() === '' || Number.isNaN(orderNumber) || !Number.isInteger(orderNumber)) {
        hasError = true
        nextError.order = 'Please enter an integer'
      } else if (orderNumber <= minOrder) {
        hasError = true
        nextError.order = `Order must be ${minOrder} or greater`
      }

      setFormError(nextError)

      if (!hasError) {
        setIsLoading(true)
        try {
          const role = await createRole(token || '', {
            id: 0,
            name: formData.name.trim(),
            order: orderNumber,
            permissions: formData.permissions,
          })
          populateSingle(role)
          onOpenChange(false)
        } catch (error) {
          if (error instanceof UnauthorizedError) {
            navigate({
              to: '/manage/login',
            })
          } else {
            // Handle error
          }
        }
        setIsLoading(false)
      }
    },
    [formData, minOrder, populateSingle, onOpenChange, token, navigate],
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Role</DialogTitle>
        </DialogHeader>

        <div className="no-scrollbar -mx-4 max-h-[75vh] overflow-y-auto px-4">
          <form onSubmit={() => false}>
            <div className="mb-4">
              <Field>
                <FieldLabel htmlFor="order">Hierarchy</FieldLabel>
                <Input
                  id="order"
                  name="order"
                  type="number"
                  min={minOrder + 1}
                  value={formData.order}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                />
                {formError.order && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{formError.order}</AlertDescription>
                  </Alert>
                )}
              </Field>
            </div>

            <div className="mb-4">
              <Field>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                />
                {formError.name && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{formError.name}</AlertDescription>
                  </Alert>
                )}
              </Field>
            </div>

            <FieldLabel className="mb-2">Permissions</FieldLabel>
            {NAVIGATION_ITEMS.map((item) => (
              <div className="mb-4 ml-2" key={item.entity}>
                <Field>
                  <FieldLabel htmlFor={`permission-${item.entity}`}>{item.title}</FieldLabel>
                  <Select
                    value={String(formData.permissions[item.entity] ?? NO_PERMISSION)}
                    disabled={isLoading}
                    onValueChange={(value) => handlePermissionChange(item.entity, value)}>
                    <SelectTrigger id={`permission-${item.entity}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={String(NO_PERMISSION)}>None</SelectItem>
                      <SelectItem value={String(READ_PERMISSION)}>Read</SelectItem>
                      <SelectItem value={String(WRITE_PERMISSION)}>Write</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            ))}
          </form>
        </div>

        <DialogFooter>
          <Button disabled={isLoading} variant="secondary" type="button" onClick={handleCancel}>
            Cancel
          </Button>
          <Button disabled={isLoading} variant="default" type="button" onClick={handleSubmit}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
