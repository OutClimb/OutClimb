import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/form_/$slug')({
  component: CustomForm,
  head: () => ({
    meta: [
      {
        title: 'Form',
      },
    ],
  }),
})

function CustomForm() {
    const { slug } = Route.useParams()
}