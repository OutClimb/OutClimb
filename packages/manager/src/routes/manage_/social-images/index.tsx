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
        <Card className="p-0 gap-0">
          <Link to="/manage/social-images/monthly" className="px-6 py-3 flex font-bold w-full items-center">
            <span className="grow">Monthly Event Images</span>
            <ChevronRight />
          </Link>
          <Link to="/manage/social-images/qtbipoc" className="border-t px-6 py-3 flex font-bold w-full items-center">
            <span className="grow">QTBIPOC Event Image</span>
            <ChevronRight />
          </Link>
        </Card>
      </Content>
    </>
  )
}
