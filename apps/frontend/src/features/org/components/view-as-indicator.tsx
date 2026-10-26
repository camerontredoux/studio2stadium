import { EyeIcon, XIcon } from "@phosphor-icons/react";
import { useNavigate } from "@tanstack/react-router";

import { Button } from "@/components/event/button";
import { Icon } from "@/components/event/icon";
import { useOrg } from "@/features/org/context/use-org";
import { cn } from "@/components/utils/cn";

/**
 * Shown to admins while they "view as" a coach/dancer, at the end of the app
 * header. Their favorites, ratings, and callbacks here live in a staff sandbox
 * (a hidden `is_staff` roster) and never surface in participant tables or
 * results. Renders nothing for real participants.
 *
 * `header` sits in the page header (desktop); `phone` sits in the phone brand
 * row, with Exit as an icon button so the org name keeps its room.
 */
export function ViewAsIndicator({
  role,
  orgSlug,
  placement,
}: {
  role: "coach" | "dancer";
  orgSlug: string;
  placement: "header" | "phone";
}) {
  const { isAdmin } = useOrg();
  const navigate = useNavigate();

  if (!isAdmin) return null;

  return (
    <div
      role="status"
      className={cn(
        "type-caption text-fg flex flex-none items-center gap-(--space-4) font-medium whitespace-nowrap",
        placement === "header"
          ? "max-[800px]:hidden"
          : "ms-auto min-[801px]:hidden",
      )}
    >
      <Icon icon={EyeIcon} className="text-amber" />
      <span>Viewing as {role}</span>
      <Button
        variant="ghost"
        size="sm"
        aria-label="Exit view as"
        onClick={() =>
          void navigate({ to: "/o/$orgSlug/admin", params: { orgSlug } })
        }
      >
        <Icon icon={XIcon} />
        <span className={placement === "phone" ? "sr-only" : undefined}>
          Exit
        </span>
      </Button>
    </div>
  );
}
