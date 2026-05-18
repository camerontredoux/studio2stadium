import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_org/o/$orgSlug/_authenticated/dancer/",
)({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/o/$orgSlug/dancer/event-info" as any,
      params: { orgSlug: params.orgSlug } as any,
    });
  },
  component: () => null,
});
