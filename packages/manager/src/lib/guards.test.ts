import { isRedirect, type ParsedLocation } from '@tanstack/react-router'
import { describe, expect, it, vi } from 'vitest'
import authGuard from '@/lib/auth-guard'
import permissionGuard from '@/lib/permission-guard'
import type { RouterContext } from '@/routes/__root'

interface FakeUser {
  requireTwoFactorSetup?: boolean
  requirePasswordReset?: boolean
}

const contextFor = (options: { loggedIn?: boolean; user?: FakeUser; allowed?: boolean }) => {
  const logout = vi.fn()
  const context = {
    user: {
      isLoggedIn: () => options.loggedIn ?? true,
      user: () => options.user ?? {},
      hasPermission: vi.fn(() => options.allowed ?? true),
      logout,
    },
  } as unknown as RouterContext
  return { context, logout }
}

const locationAt = (pathname: string, href = pathname) => ({ pathname, href }) as ParsedLocation

const captureThrown = async (action: () => Promise<unknown>) => {
  try {
    await action()
  } catch (error) {
    return error
  }
  return undefined
}

describe('authGuard', () => {
  it('redirects logged-out users to login, remembering where they were going', async () => {
    const { context } = contextFor({ loggedIn: false })

    const thrown = await captureThrown(() => authGuard(context, locationAt('/manage/form', '/manage/form?page=2')))

    expect(isRedirect(thrown)).toBe(true)
    expect((thrown as { options: unknown }).options).toMatchObject({
      to: '/manage/login',
      search: { redirect: '/manage/form?page=2' },
    })
  })

  it('sends users who must set up two-factor to the setup page', async () => {
    const { context } = contextFor({ user: { requireTwoFactorSetup: true } })

    const thrown = await captureThrown(() => authGuard(context, locationAt('/manage/form')))

    expect(isRedirect(thrown)).toBe(true)
    expect((thrown as { options: unknown }).options).toMatchObject({ to: '/manage/two-factor' })
  })

  it('does not redirect in a loop when already on the two-factor page', async () => {
    const { context } = contextFor({ user: { requireTwoFactorSetup: true } })
    await expect(authGuard(context, locationAt('/manage/two-factor'))).resolves.toBeUndefined()
  })

  it('lets a pending password reset happen before two-factor setup', async () => {
    const { context } = contextFor({ user: { requireTwoFactorSetup: true, requirePasswordReset: true } })
    await expect(authGuard(context, locationAt('/manage/form'))).resolves.toBeUndefined()
  })

  it('lets fully set up users through', async () => {
    const { context } = contextFor({})
    await expect(authGuard(context, locationAt('/manage/form'))).resolves.toBeUndefined()
  })
})

describe('permissionGuard', () => {
  it('lets users with the permission through', async () => {
    const { context, logout } = contextFor({ allowed: true })

    await expect(permissionGuard(context, 'form', 1)).resolves.toBeUndefined()
    expect(logout).not.toHaveBeenCalled()
  })

  it('checks the requested entity and level', async () => {
    const { context } = contextFor({ allowed: true })

    await permissionGuard(context, 'form', 2)

    expect(context.user.hasPermission).toHaveBeenCalledWith('form', 2)
  })

  it('logs out and redirects to login when the permission is missing', async () => {
    const { context, logout } = contextFor({ allowed: false })

    const thrown = await captureThrown(() => permissionGuard(context, 'form', 1))

    expect(logout).toHaveBeenCalledOnce()
    expect(isRedirect(thrown)).toBe(true)
    expect((thrown as { options: unknown }).options).toMatchObject({ to: '/manage/login' })
  })
})
