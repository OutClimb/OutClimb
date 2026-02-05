import { Content } from '@/components/content'
import { Header } from '@/components/header'
import { Card } from '@/components/ui/card'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'

export const Route = createFileRoute('/manage_/social-images/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <>
      <Header>Social Images</Header>

      <Content>
        <Card>
          <Link to="/manage/social-images/monthly" className="px-6 flex font-bold w-full items-center">
            <span className="grow">Monthly Event Images</span>
            <ChevronRight />
          </Link>
        </Card>
      </Content>
    </>
  )
}
