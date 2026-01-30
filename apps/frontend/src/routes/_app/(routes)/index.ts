import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/")({
  beforeLoad: () => {
    throw redirect({ to: "/feed" });
  },
});
