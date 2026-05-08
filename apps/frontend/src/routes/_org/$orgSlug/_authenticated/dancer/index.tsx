import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_org/$orgSlug/_authenticated/dancer/",
)({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/$orgSlug/dancer/video-library",
      params: { orgSlug: params.orgSlug },
    });
  },
});
