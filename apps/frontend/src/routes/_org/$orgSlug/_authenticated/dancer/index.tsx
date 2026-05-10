import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_org/$orgSlug/_authenticated/dancer/",
)({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/$orgSlug/dancer/video-library" as any,
      params: { orgSlug: params.orgSlug } as any,
    });
  },
  component: () => null,
});
