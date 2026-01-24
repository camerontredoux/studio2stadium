import { useSession } from "@/features/auth/api/queries";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/session")({
  component: RouteComponent,
});

function RouteComponent() {
  const { session } = useSession();

  return (
    <pre>
      {JSON.stringify(session, (_, v) => (v instanceof Set ? [...v] : v), 2)}
    </pre>
  );
}
