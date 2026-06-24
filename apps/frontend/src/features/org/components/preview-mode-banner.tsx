import { Button } from "@/components/ui/button";
import { useOrg } from "@/features/org/context/use-org";
import { useNavigate } from "@tanstack/react-router";
import { EyeIcon, XIcon } from "lucide-react";

/**
 * Shown to admins while they "view as" a coach/dancer. Their favorites, ratings,
 * and callbacks here live in a staff sandbox (a hidden `is_staff` roster) and
 * never surface in participant tables or results. Renders nothing for real
 * participants.
 */
export function PreviewModeBanner({
  role,
  orgSlug,
}: {
  role: "coach" | "dancer";
  orgSlug: string;
}) {
  const { isAdmin } = useOrg();
  const navigate = useNavigate();

  if (!isAdmin) return null;

  const audience = role === "coach" ? "coaches" : "dancers";

  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-amber-700 dark:text-amber-300">
      <EyeIcon className="size-3.5 shrink-0" />
      <span className="text-xs 2xl:text-sm">
        Preview mode — viewing as {role}. Your activity here is a staff sandbox
        and stays hidden from {audience} and results.
      </span>
      <Button
        variant="ghost"
        size="xs"
        className="ml-auto h-6 gap-1 px-2 text-amber-700 hover:bg-amber-500/20 dark:text-amber-300"
        onClick={() =>
          void navigate({ to: "/o/$orgSlug/admin", params: { orgSlug } })
        }
      >
        <XIcon className="size-3" />
        Exit
      </Button>
    </div>
  );
}
