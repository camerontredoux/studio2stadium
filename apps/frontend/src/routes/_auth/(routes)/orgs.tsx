import { AuthPagesSelect } from "@/components/shared/auth-pages-select";
import { PublicOrgsList } from "@/features/orgs/components/public-orgs-list";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/(routes)/orgs")({
  component: OrgsPage,
});

function OrgsPage() {
  return (
    <div className="flex w-full flex-col gap-4">
      <PublicOrgsList />
      <AuthPagesSelect variant="orgs" />
    </div>
  );
}
