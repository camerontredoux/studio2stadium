import { Button } from "@/components/ui/button";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/events/")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = Route.useNavigate();

  return (
    <div>
      <Button
        onClick={() => navigate({ search: { states: ["CA", "NY", "TX"] } })}
      >
        Some
      </Button>
    </div>
  );
}
