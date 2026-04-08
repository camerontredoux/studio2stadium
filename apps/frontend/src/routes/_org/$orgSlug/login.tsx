import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { OrgAuthLayout } from "@/features/org/components/org-auth-layout";
import { OrgLoginForm } from "@/features/org/components/org-login-form";

export const Route = createFileRoute("/_org/$orgSlug/login")({
  component: OrgLoginPage,
});

function OrgLoginPage() {
  const navigate = useNavigate();
  return (
    <OrgAuthLayout>
      <OrgLoginForm onSuccess={() => navigate({ to: "/feed" })} />
    </OrgAuthLayout>
  );
}
