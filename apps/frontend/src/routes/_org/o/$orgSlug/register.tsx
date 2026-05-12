import {
  createFileRoute,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import { z } from "zod";
import { OrgAuthLayout } from "@/features/org/components/org-auth-layout";
import { OrgRegisterForm } from "@/features/org/components/org-register-form";
import { isReservedOrgSlug } from "@/features/org/lib/reserved-slugs";

const searchSchema = z.object({ t: z.string().min(1) });

export const Route = createFileRoute("/_org/o/$orgSlug/register")({
  skipRouteOnParseError: { params: true },
  params: {
    parse: ({ orgSlug }) => {
      if (isReservedOrgSlug(orgSlug)) throw new Error("reserved-slug");
      return { orgSlug };
    },
    stringify: ({ orgSlug }) => ({ orgSlug }),
  },
  validateSearch: searchSchema,
  component: RegisterPage,
});

function RegisterPage() {
  const { orgSlug } = useParams({ from: "/_org/o/$orgSlug/register" });
  const { t } = Route.useSearch();
  const navigate = useNavigate();
  return (
    <OrgAuthLayout>
      <OrgRegisterForm
        token={t}
        onSuccess={() =>
          navigate({ to: "/o/$orgSlug/login", params: { orgSlug } })
        }
      />
    </OrgAuthLayout>
  );
}
