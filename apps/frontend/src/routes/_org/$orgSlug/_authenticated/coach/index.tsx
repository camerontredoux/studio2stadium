import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_org/$orgSlug/_authenticated/coach/")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/$orgSlug/coach/dancers",
      params: { orgSlug: params.orgSlug },
    });
  },
  component: () => null,
});
