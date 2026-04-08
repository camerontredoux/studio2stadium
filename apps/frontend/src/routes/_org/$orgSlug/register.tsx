import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { z } from "zod";
import { OrgAuthLayout } from "@/features/org/components/org-auth-layout";
import { OrgRegisterForm } from "@/features/org/components/org-register-form";

const searchSchema = z.object({ t: z.string().min(1) });

export const Route = createFileRoute("/_org/$orgSlug/register")({
  validateSearch: searchSchema,
  component: RegisterPage,
});

function RegisterPage() {
  const { orgSlug } = useParams({ from: "/_org/$orgSlug/register" });
  const { t } = Route.useSearch();
  const navigate = useNavigate();
  return (
    <OrgAuthLayout>
      <OrgRegisterForm
        token={t}
        onSuccess={() => navigate({ to: "/$orgSlug/login", params: { orgSlug } })}
      />
    </OrgAuthLayout>
  );
}
