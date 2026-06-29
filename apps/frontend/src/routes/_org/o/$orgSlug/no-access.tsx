import { createFileRoute, Link } from "@tanstack/react-router";
import { OrgAuthLayout } from "@/features/org/components/org-auth-layout";
import { buttonVariants } from "@/components/ui/button";
import { ShieldXIcon } from "lucide-react";

export const Route = createFileRoute("/_org/o/$orgSlug/no-access")({
  component: NoAccessPage,
});

function NoAccessPage() {
  return (
    <OrgAuthLayout>
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="bg-muted flex size-12 items-center justify-center rounded-full">
          <ShieldXIcon className="text-muted-foreground size-6" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-semibold">No event access</h2>
          <p className="text-muted-foreground text-sm">
            You are not currently on the roster for this event. If you believe
            this is a mistake, contact the event organizer.
          </p>
        </div>
        <Link to="/" className={buttonVariants({ variant: "outline", className: "w-full" })}>
          Go home
        </Link>
      </div>
    </OrgAuthLayout>
  );
}
