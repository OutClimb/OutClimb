import { Content } from '@/components/content'
import { Header } from '@/components/header'
import { createFileRoute, Link } from '@tanstack/react-router'
import { CalendarDays, ChevronRight, ImageIcon } from 'lucide-react'

const GENERATORS = [
  {
    to: '/manage/social-images/monthly',
    title: 'Monthly Event Images',
    description: 'An overview image for the month plus one image per event, downloaded as a zip',
    icon: CalendarDays,
  },
  {
    to: '/manage/social-images/qtbipoc',
    title: 'QTBIPOC Event Image',
    description: 'A single image for an upcoming QTBIPOC event',
    icon: ImageIcon,
  },
] as const

export const Route = createFileRoute('/manage_/social-images/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <>
      <Header>Social Images</Header>

      <Content>
        <div className="grid gap-4 sm:grid-cols-2">
          {GENERATORS.map((generator) => (
            <Link
              key={generator.to}
              to={generator.to}
              className="group flex items-start gap-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10 transition hover:shadow-sm hover:ring-primary/40">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <generator.icon className="size-5" />
              </div>
              <div className="min-w-0 grow">
                <p className="font-semibold">{generator.title}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{generator.description}</p>
              </div>
              <ChevronRight className="mt-2.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
            </Link>
          ))}
        </div>
      </Content>
    </>
  )
}
