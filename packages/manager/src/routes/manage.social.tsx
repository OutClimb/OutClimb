'use client'

import authGuard from '@/lib/auth-guard'
import { createFileRoute } from '@tanstack/react-router'
import { Header } from '@/components/header'
import { SocialImageForm } from '@/components/social-image-form'

export const Route = createFileRoute('/manage/social')({
  component: Social,
  head: () => ({
    meta: [
      {
        title: 'Social Images | OutClimb Management',
      },
    ],
  }),
  beforeLoad: ({ context, location }) => authGuard(context, location),
})

function Social() {
  return (
    <>
      <Header>Social Images</Header>
      <SocialImageForm />
    </>
  )
}
