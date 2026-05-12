import {
  createFileRoute,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import { z } from "zod";
import { OrgAuthLayout } from "@/features/org/components/org-auth-layout";
import { OrgSchoolRegisterForm } from "@/features/org/components/org-school-register-form";
import { isReservedOrgSlug } from "@/features/org/lib/reserved-slugs";

const searchSchema = z.object({ t: z.string().min(1) });

export const Route = createFileRoute("/_org/$orgSlug/register-school")({
  skipRouteOnParseError: { params: true },
  params: {
    parse: ({ orgSlug }) => {
      if (isReservedOrgSlug(orgSlug)) throw new Error("reserved-slug");
      return { orgSlug };
    },
    stringify: ({ orgSlug }) => ({ orgSlug }),
  },
  validateSearch: searchSchema,
  component: RegisterSchoolPage,
});

function RegisterSchoolPage() {
  const { orgSlug } = useParams({ from: "/_org/$orgSlug/register-school" });
  const { t } = Route.useSearch();
  const navigate = useNavigate();
  return (
    <OrgAuthLayout>
      <OrgSchoolRegisterForm
        token={t}
        onSuccess={() =>
          navigate({ to: "/$orgSlug/login", params: { orgSlug } })
        }
      />
    </OrgAuthLayout>
  );
}
