import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/events/")({
  beforeLoad: () => {
    throw redirect({ to: "/events/schools" });
  },
});
