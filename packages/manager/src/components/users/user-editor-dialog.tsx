'use client'

import { Button } from '@/components/ui/button'
import { createUser, updateUser } from '@/api/user'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel } from '../ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { UnauthorizedError } from '@/errors/unauthorized'
import { useCallback, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import useRoleStore from '@/stores/role'
import useUserStore from '@/stores/user'
import useSelfStore from '@/stores/self'
import { validatePassword } from '@/lib/validate-password'
import type { User } from '@/types/user'

interface FormData {
  id: number
  username: string
  name: string
  email: string
  password: string
  role: string
  requirePasswordReset: boolean
  resetTwoFactor: boolean
}

interface FormError {
  username: string
  name: string
  email: string
  password: string
  role: string
}

const emptyFormData: FormData = {
  id: 0,
  username: '',
  name: '',
  email: '',
  password: '',
  role: '',
  requirePasswordReset: true,
  resetTwoFactor: false,
}

const emptyFormError: FormError = {
  username: '',
  name: '',
  email: '',
  password: '',
  role: '',
}

function dataFromUser(user: User): FormData {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    password: '',
    role: user.role,
    requirePasswordReset: user.requirePasswordReset ?? false,
    resetTwoFactor: false,
  }
}

interface UserEditorDialogProps {
  open: boolean
  onOpenChange: (isOpen: boolean) => void
  initialUser?: User
}

export function UserEditorDialog({ open, onOpenChange, initialUser }: UserEditorDialogProps) {
  const navigate = useNavigate()
  const { token, user: getUser } = useSelfStore()
  const { populateSingle } = useUserStore()
  const { list: listRoles } = useRoleStore()

  const isEditing = initialUser !== undefined

  const allRoles = listRoles()
  const selfUser = getUser()
  const actorRole = allRoles.find((role) => role.name === selfUser?.role)
  const availableRoles =
    actorRole === undefined
      ? []
      : actorRole.order === 0
        ? allRoles
        : allRoles.filter((role) => role.order >= actorRole.order)

  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [formError, setFormError] = useState<FormError>(emptyFormError)
  const [formData, setFormData] = useState<FormData>(emptyFormData)

  if (
    !open &&
    (formData.id !== 0 ||
      formData.username !== '' ||
      formData.name !== '' ||
      formData.email !== '' ||
      formData.password !== '' ||
      formData.role !== '')
  ) {
    setFormData(emptyFormData)
    setFormError(emptyFormError)
  }

  if (open && formData.id === 0 && initialUser != null) {
    setFormData(dataFromUser(initialUser))
  }

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }, [])

  const handleRoleChange = useCallback((value: string) => {
    setFormData((prev) => ({ ...prev, role: value }))
  }, [])

  const handleRequirePasswordResetChange = useCallback((checked: boolean) => {
    setFormData((prev) => ({ ...prev, requirePasswordReset: checked }))
  }, [])

  const handleResetTwoFactorChange = useCallback((checked: boolean) => {
    setFormData((prev) => ({ ...prev, resetTwoFactor: checked }))
  }, [])

  const handleCancel = useCallback(() => {
    onOpenChange(false)
  }, [onOpenChange])

  const handleSubmit = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault()
      let hasError = false
      const nextError: FormError = { ...emptyFormError }

      if (!formData.username.trim()) {
        hasError = true
        nextError.username = 'Please fill in this field'
      }

      if (!formData.name.trim()) {
        hasError = true
        nextError.name = 'Please fill in this field'
      }

      if (!formData.email.trim()) {
        hasError = true
        nextError.email = 'Please fill in this field'
      }

      if (isEditing) {
        if (formData.password.trim()) {
          const passwordError = validatePassword(formData.password, formData.username.trim())
          if (passwordError) {
            hasError = true
            nextError.password = passwordError
          }
        }
      } else {
        const passwordError = validatePassword(formData.password, formData.username.trim())
        if (passwordError) {
          hasError = true
          nextError.password = passwordError
        }
      }

      if (!formData.role.trim()) {
        hasError = true
        nextError.role = 'Please select a role'
      }

      setFormError(nextError)

      if (!hasError) {
        setIsLoading(true)
        try {
          const payload = {
            disabled: false,
            email: formData.email.trim(),
            name: formData.name.trim(),
            password: formData.password,
            requirePasswordReset: formData.requirePasswordReset,
            resetTwoFactor: formData.resetTwoFactor,
            username: formData.username.trim(),
            role: formData.role,
          }
          const user = isEditing
            ? await updateUser(token || '', formData.id, payload)
            : await createUser(token || '', payload)
          populateSingle(user)
          onOpenChange(false)
        } catch (error) {
          if (error instanceof UnauthorizedError) {
            navigate({ to: '/manage/login' })
          }
        }
        setIsLoading(false)
      }
    },
    [formData, isEditing, populateSingle, onOpenChange, token, navigate],
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit User' : 'Create User'}</DialogTitle>
        </DialogHeader>

        <div className="no-scrollbar -mx-6 -my-1 max-h-[70vh] overflow-y-auto px-6 py-1">
          <form onSubmit={() => false}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="username">Username</FieldLabel>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  autoCapitalize="none"
                  autoComplete="username"
                  value={formData.username}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                />
                <FieldError>{formError.username}</FieldError>
              </Field>

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

              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoCapitalize="none"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                />
                <FieldError>{formError.email}</FieldError>
              </Field>

              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <FieldDescription>
                  {isEditing
                    ? 'Enter a new password for this user. Must be 16-72 characters and include an uppercase letter, lowercase letter, number, and symbol. Must not contain the username or match the current password.'
                    : 'Must be 16-72 characters and include an uppercase letter, lowercase letter, number, and symbol. Must not contain the username.'}
                </FieldDescription>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoCapitalize="none"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                  required={!isEditing}
                />
                <FieldError>{formError.password}</FieldError>
              </Field>

              <Field>
                <FieldLabel htmlFor="role">Role</FieldLabel>
                <Select value={formData.role} disabled={isLoading} onValueChange={handleRoleChange}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map((role) => (
                      <SelectItem key={role.id} value={role.name}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError>{formError.role}</FieldError>
              </Field>

              <Field orientation="horizontal">
                <FieldContent>
                  <FieldLabel htmlFor="requirePasswordReset">Require password reset</FieldLabel>
                  <FieldDescription>The user must choose a new password on their next login</FieldDescription>
                </FieldContent>
                <Switch
                  id="requirePasswordReset"
                  checked={formData.requirePasswordReset}
                  disabled={isLoading}
                  onCheckedChange={handleRequirePasswordResetChange}
                />
              </Field>

              {isEditing && initialUser?.twoFactorEnabled && (
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldLabel htmlFor="resetTwoFactor">Reset two-factor</FieldLabel>
                    <FieldDescription>
                      Removes the user's authenticator so they can set it up again, such as after losing their device
                    </FieldDescription>
                  </FieldContent>
                  <Switch
                    id="resetTwoFactor"
                    checked={formData.resetTwoFactor}
                    disabled={isLoading}
                    onCheckedChange={handleResetTwoFactorChange}
                  />
                </Field>
              )}
            </FieldGroup>
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
