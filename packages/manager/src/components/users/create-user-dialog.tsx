'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createUser } from '@/api/user'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldDescription, FieldLabel } from '../ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UnauthorizedError } from '@/errors/unauthorized'
import { useCallback, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import useUserStore from '@/stores/user'
import useSelfStore from '@/stores/self'
import { validatePassword } from '@/lib/validate-password'

interface FormData {
  username: string
  name: string
  email: string
  password: string
  role: string
  requirePasswordReset: boolean
}

interface FormError {
  username: string
  name: string
  email: string
  password: string
  role: string
}

const emptyFormData: FormData = {
  username: '',
  name: '',
  email: '',
  password: '',
  role: '',
  requirePasswordReset: true,
}

const emptyFormError: FormError = {
  username: '',
  name: '',
  email: '',
  password: '',
  role: '',
}

interface CreateUserDialogProps {
  open: boolean
  onOpenChange: (isOpen: boolean) => void
}

export function CreateUserDialog({ open, onOpenChange }: CreateUserDialogProps) {
  const navigate = useNavigate()
  const { token } = useSelfStore()
  const { populateSingle } = useUserStore()

  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [formError, setFormError] = useState<FormError>(emptyFormError)
  const [formData, setFormData] = useState<FormData>(emptyFormData)

  if (
    !open &&
    (formData.username !== '' ||
      formData.name !== '' ||
      formData.email !== '' ||
      formData.password !== '' ||
      formData.role !== '' ||
      !formData.requirePasswordReset)
  ) {
    setFormData(emptyFormData)
    setFormError(emptyFormError)
  }

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }, [])

  const handleRoleChange = useCallback((value: string) => {
    setFormData((prev) => ({
      ...prev,
      role: value,
    }))
  }, [])

  const handleRequirePasswordResetChange = useCallback((value: string) => {
    setFormData((prev) => ({
      ...prev,
      requirePasswordReset: value === 'yes',
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

      const passwordError = validatePassword(formData.password, formData.username.trim())
      if (passwordError) {
        hasError = true
        nextError.password = passwordError
      }

      if (!formData.role.trim()) {
        hasError = true
        nextError.role = 'Please select a role'
      }

      setFormError(nextError)

      if (!hasError) {
        setIsLoading(true)
        try {
          const user = await createUser(token || '', {
            disabled: false,
            email: formData.email.trim(),
            name: formData.name.trim(),
            password: formData.password,
            requirePasswordReset: formData.requirePasswordReset,
            username: formData.username.trim(),
            role: formData.role,
          })
          populateSingle(user)
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
    [formData, populateSingle, onOpenChange, token, navigate],
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create User</DialogTitle>
        </DialogHeader>

        <div className="no-scrollbar -mx-4 max-h-[75vh] overflow-y-auto px-4">
          <form onSubmit={() => false}>
            <div className="mb-4">
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
                {formError.username && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{formError.username}</AlertDescription>
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

            <div className="mb-4">
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
                {formError.email && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{formError.email}</AlertDescription>
                  </Alert>
                )}
              </Field>
            </div>

            <div className="mb-4">
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <FieldDescription>
                  Must be 16-72 characters and include an uppercase letter, lowercase letter, number, and symbol. Must
                  not contain the username.
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
                  required
                />
                {formError.password && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{formError.password}</AlertDescription>
                  </Alert>
                )}
              </Field>
            </div>

            <div className="mb-4">
              <Field>
                <FieldLabel htmlFor="role">Role</FieldLabel>
                <Select value={formData.role} disabled={isLoading} onValueChange={handleRoleChange}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Owner">Owner</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                {formError.role && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{formError.role}</AlertDescription>
                  </Alert>
                )}
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="requirePasswordReset">Require password reset on next login</FieldLabel>
              <Select
                value={formData.requirePasswordReset ? 'yes' : 'no'}
                disabled={isLoading}
                onValueChange={handleRequirePasswordResetChange}>
                <SelectTrigger id="requirePasswordReset">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </Field>
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
