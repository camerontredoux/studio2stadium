import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { OrgAuthLayout } from "@/features/org/components/org-auth-layout";
import { OrgLoginForm } from "@/features/org/components/org-login-form";
import { isReservedOrgSlug } from "@/features/org/lib/reserved-slugs";
import { z } from "zod";

export const Route = createFileRoute("/_org/o/$orgSlug/login")({
  skipRouteOnParseError: { params: true },
  params: {
    parse: ({ orgSlug }) => {
      if (isReservedOrgSlug(orgSlug)) throw new Error("reserved-slug");
      return { orgSlug };
    },
    stringify: ({ orgSlug }) => ({ orgSlug }),
  },
  validateSearch: z.object({
    redirect: z.string().optional(),
  }),
  component: OrgLoginPage,
});

function OrgLoginPage() {
  const { orgSlug } = Route.useParams();
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  return (
    <OrgAuthLayout description="Sign in to your account to continue">
      <OrgLoginForm
        onSuccess={() =>
          navigate({ to: redirect ?? `/o/${orgSlug}/dancer`, replace: true })
        }
      />
    </OrgAuthLayout>
  );
}
