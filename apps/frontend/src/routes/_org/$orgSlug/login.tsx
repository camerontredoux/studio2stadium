import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { OrgLoginForm } from "@/features/org/components/org-login-form";

export const Route = createFileRoute("/_org/$orgSlug/login")({
  component: OrgLoginPage,
});

function OrgLoginPage() {
  const navigate = useNavigate();
  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--org-primary, #0f172a)" }}
    >
      <OrgLoginForm
        onSuccess={() => navigate({ to: "/feed" })}
      />
    </div>
  );
}
