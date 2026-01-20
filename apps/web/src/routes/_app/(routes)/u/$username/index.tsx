import { DancerProfile } from '@/features/dancer'
import { profile } from '@/features/profile'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/(routes)/u/$username/')({
  loader: ({ context: { queryClient }, params }) =>
    queryClient.ensureQueryData(profile.api.queries.profile(params.username)),
  component: RouteComponent,
})

function RouteComponent() {
  const { username } = Route.useParams()
  const { data } = useSuspenseQuery(profile.api.queries.profile(username))

  switch (data.type) {
    case "dancer":
      return <DancerProfile username={username} />
    case "school":
      return <DancerProfile username={username} />
  }
}
