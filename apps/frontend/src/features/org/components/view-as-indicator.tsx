import { EyeIcon, XIcon } from "@phosphor-icons/react";
import { useNavigate } from "@tanstack/react-router";

import { Button } from "@/components/event/button";
import { Icon } from "@/components/event/icon";
import { useOrg } from "@/features/org/context/use-org";
import { cn } from "@/components/utils/cn";

/**
 * Shown to admins while they "view as" a coach/dancer, just before the page's
 * header buttons, in a small chip. Their favorites, ratings, and callbacks here live in a staff sandbox
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
        "text-fg bg-surface-chip border-line flex h-7 flex-none items-center gap-(--space-4) rounded-(--radius-5) border ps-(--space-8) pe-1 text-[12.5px] leading-none font-medium whitespace-nowrap",
        placement === "header"
          ? "max-[800px]:hidden"
          : "mx-2 self-center min-[801px]:hidden",
      )}
    >
      <Icon icon={EyeIcon} className="text-amber size-3.5" />
      <span>{placement === "phone" ? `As ${role}` : `Viewing as ${role}`}</span>
      <Button
        variant="ghost"
        size="sm"
        aria-label="Exit view as"
        className="size-5 min-w-0 px-0 sm:size-5 sm:h-5"
        onClick={() =>
          void navigate({ to: "/o/$orgSlug/admin", params: { orgSlug } })
        }
      >
        <Icon icon={XIcon} className="size-3" />
      </Button>
    </div>
  );
}
