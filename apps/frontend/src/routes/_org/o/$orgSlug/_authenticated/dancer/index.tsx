import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_org/o/$orgSlug/_authenticated/dancer/",
)({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/o/$orgSlug/dancer/video-library" as any,
      params: { orgSlug: params.orgSlug } as any,
    });
  },
  component: () => null,
});
