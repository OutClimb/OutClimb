'use client'

import { Button } from '@/components/ui/button'
import { createRole, updateRole } from '@/api/role'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldError, FieldLabel } from '../ui/field'
import { Input } from '@/components/ui/input'
import { NAVIGATION_ITEMS } from '@/lib/navigation-items'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UnauthorizedError } from '@/errors/unauthorized'
import { useCallback, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import useRoleStore from '@/stores/role'
import useSelfStore, { NO_PERMISSION, READ_PERMISSION, WRITE_PERMISSION } from '@/stores/self'
import type { Role } from '@/types/role'

interface FormData {
  id: number
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

const buildPermissions = (existing: Record<string, number>): Record<string, number> =>
  NAVIGATION_ITEMS.reduce<Record<string, number>>((acc, item) => {
    acc[item.entity] = existing[item.entity] ?? NO_PERMISSION
    return acc
  }, {})

const emptyFormError: FormError = {
  name: '',
  order: '',
}

function dataFromRole(role: Role): FormData {
  return {
    id: role.id,
    name: role.name,
    order: String(role.order),
    permissions: buildPermissions(role.permissions),
  }
}

interface RoleEditorDialogProps {
  open: boolean
  onOpenChange: (isOpen: boolean) => void
  initialRole?: Role
}

export function RoleEditorDialog({ open, onOpenChange, initialRole }: RoleEditorDialogProps) {
  const navigate = useNavigate()
  const { token, user: getUser } = useSelfStore()
  const { list: listRoles, populateSingle } = useRoleStore()

  const isEditing = initialRole !== undefined

  const selfUser = getUser()
  const actorRole = listRoles().find((role) => role.name === selfUser?.role)
  const minOrder = actorRole === undefined ? Number.MAX_SAFE_INTEGER : actorRole.order

  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [formError, setFormError] = useState<FormError>(emptyFormError)
  const [formData, setFormData] = useState<FormData>({
    id: 0,
    name: '',
    order: (minOrder + 1).toString(),
    permissions: emptyPermissions(),
  })

  if (
    !open &&
    (formData.id !== 0 ||
      formData.name !== '' ||
      formData.order !== (minOrder + 1).toString() ||
      Object.values(formData.permissions).some((value) => value !== NO_PERMISSION))
  ) {
    setFormData({ id: 0, name: '', order: (minOrder + 1).toString(), permissions: emptyPermissions() })
    setFormError(emptyFormError)
  }

  if (open && formData.id === 0 && initialRole != null) {
    setFormData(dataFromRole(initialRole))
  }

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }, [])

  const handlePermissionChange = useCallback((entity: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: { ...prev.permissions, [entity]: Number(value) },
    }))
  }, [])

  const handleCancel = useCallback(() => {
    onOpenChange(false)
  }, [onOpenChange])

  const handleSubmit = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
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
          const payload = {
            id: formData.id,
            name: formData.name.trim(),
            order: orderNumber,
            permissions: formData.permissions,
          }
          const role = isEditing
            ? await updateRole(token || '', payload)
            : await createRole(token || '', payload)
          populateSingle(role)
          onOpenChange(false)
        } catch (error) {
          if (error instanceof UnauthorizedError) {
            navigate({ to: '/manage/login' })
          }
        }
        setIsLoading(false)
      }
    },
    [formData, isEditing, minOrder, populateSingle, onOpenChange, token, navigate],
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Role' : 'Create Role'}</DialogTitle>
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
                <FieldError>{formError.order}</FieldError>
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
                <FieldError>{formError.name}</FieldError>
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
                      <SelectItem value={String(WRITE_PERMISSION)}>Read & Write</SelectItem>
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
            {isEditing ? 'Save' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
