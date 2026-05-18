import { AuthPagesSelect } from "@/components/shared/auth-pages-select";
import { PublicOrgsList } from "@/features/orgs/components/public-orgs-list";
import { Button } from "@/components/ui/button";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/(routes)/orgs")({
  component: OrgsPage,
});

function OrgsPage() {
  return (
    <div className="flex w-full flex-col gap-4">
      <PublicOrgsList />

      <div className="flex items-center justify-between gap-2">
        <AuthPagesSelect />
        <Button
          type="button"
          variant="link"
          className="text-brand p-0 text-sm font-medium"
          render={<Link to="/login" replace={true} />}
        >
          Main login
        </Button>
      </div>
    </div>
  );
}
