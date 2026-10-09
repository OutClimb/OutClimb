'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Loader2 } from 'lucide-react'
import { beginTwoFactorSetup, confirmTwoFactorSetup } from '@/api/user'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NAVIGATION_ITEMS } from '@/lib/navigation-items'
import type React from 'react'
import { Spinner } from '@/components/ui/spinner'
import type { TwoFactorSetupResponse } from '@/types/user'
import { UnauthorizedError } from '@/errors/unauthorized'
import { useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import useSelfStore, { READ_PERMISSION } from '@/stores/self'

export function TwoFactorSetupForm() {
  const navigate = useNavigate()
  const { token, hasPermission, login, logout } = useSelfStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [setup, setSetup] = useState<TwoFactorSetupResponse | null>(null)
  const [code, setCode] = useState('')
  const hasStarted = useRef(false)

  useEffect(() => {
    // Starting setup generates a new secret, so only do it once
    if (hasStarted.current) {
      return
    }
    hasStarted.current = true

    const start = async () => {
      try {
        setSetup(await beginTwoFactorSetup(token || ''))
      } catch (error) {
        if (error instanceof UnauthorizedError) {
          logout()
          navigate({ to: '/manage/login' })
        } else {
          setError('Unable to start two-factor setup. Please try again.')
        }
      }
    }

    start()
  }, [token, logout, navigate])

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    if (!/^\d{6}$/.test(code)) {
      setError('Please enter the 6 digit code from your authenticator app')
      return
    }

    setIsLoading(true)

    try {
      login(await confirmTwoFactorSetup(token || '', code))

      const firstNavItem = NAVIGATION_ITEMS.find((item) => hasPermission(item.entity, READ_PERMISSION))
      if (!firstNavItem) {
        logout()
        navigate({ to: '/manage/login' })
      } else {
        navigate({ to: firstNavItem.href })
      }
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        logout()
        navigate({ to: '/manage/login' })
      } else if (error instanceof Error) {
        setError(error.message)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Two-Factor Setup</CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit} className="flex flex-col gap-(--card-spacing)">
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
            Your role requires two-factor authentication. Scan the QR code with an authenticator app, then enter the 6
            digit code it shows.
          </div>
          {setup ? (
            <>
              <img src={setup.qrCode} alt="Two-factor QR code" className="mx-auto h-48 w-48 rounded-lg bg-white" />
              <div className="space-y-1 text-center text-xs text-muted-foreground">
                <p>Can't scan it? Enter this key instead:</p>
                <code className="block break-all font-mono text-foreground">{setup.secret}</code>
              </div>
            </>
          ) : (
            !error && (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            )
          )}
          <div className="mb-4 space-y-2">
            <Label htmlFor="code">Code</Label>
            <Input
              id="code"
              name="code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.trim())}
              autoComplete="one-time-code"
              disabled={isLoading || !setup}
              required
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" type="submit" disabled={isLoading || !setup}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              'Enable two-factor'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
