import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/resources/")({
  beforeLoad: () => {
    throw redirect({ to: "/resources/library" });
  },
});
