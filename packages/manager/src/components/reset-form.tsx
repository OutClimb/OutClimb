'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type React from 'react'
import { UnauthorizedError } from '@/errors/unauthorized'
import { updatePassword } from '@/api/user'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import useUserStore from '@/stores/user'

export function ResetForm() {
  const navigate = useNavigate()
  const { token, logout } = useUserStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    password: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate form
    if (!formData.password) {
      setError('Please fill in all fields')
      return
    }

    if (formData.password.length < 16) {
      setError('Password must be at least 16 characters long')
      return
    }

    if (formData.password.length > 72) {
      setError('Password must be at most 72 characters long')
      return
    }

    if (!/[^a-zA-Z0-9]/.test(formData.password)) {
      setError('Password must contain at least one special character')
      return
    }

    if (!/[A-Z]/.test(formData.password)) {
      setError('Password must contain at least one uppercase letter')
      return
    }

    if (!/[a-z]/.test(formData.password)) {
      setError('Password must contain at least one lowercase letter')
      return
    }

    if (!/[0-9]/.test(formData.password)) {
      setError('Password must contain at least one number')
      return
    }

    setIsLoading(true)

    try {
      if (token) {
        await updatePassword(token, formData.password)
      }
      logout()
      navigate({ to: '/manage/login' })
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        navigate({ to: '/manage/login' })
      } else {
        // Handle error
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Password Reset</CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <p className="text-xs text-gray-600">
            Your new password must:
            <ul className="list-disc list-inside mt-2 ml-2">
              <li>be 16 characters long</li>
              <li>be under 72 characters</li>
              <li>contain one special character</li>
              <li>contain one uppercase character</li>
              <li>contain one lowercase character</li>
              <li>contain one number</li>
              <li>not contain your username</li>
              <li>not be the same as your last password</li>
            </ul>
          </p>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
              required
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full mt-4" type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Resetting password...
              </>
            ) : (
              'Submit'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
