import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/(routes)/u/$username/recruiting')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_app/(routes)/u/recruiting"!</div>
}
