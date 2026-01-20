import { explore } from '@/features/explore'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/(routes)/explore')({
  loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(explore.api.queries.explore()),
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_app/explore"!</div>
}
