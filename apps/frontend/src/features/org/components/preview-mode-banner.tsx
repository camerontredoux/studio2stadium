import { EyeIcon, XIcon } from "@phosphor-icons/react";
import { useNavigate } from "@tanstack/react-router";

import { Button } from "@/components/event/button";
import { Icon } from "@/components/event/icon";
import { useOrg } from "@/features/org/context/use-org";

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
    <div
      role="status"
      className="border-line bg-surface flex min-h-(--control-lg) items-center gap-(--space-8) rounded-(--radius-10) border py-(--space-4) ps-(--space-12) pe-(--space-4)"
    >
      <Icon icon={EyeIcon} className="text-amber" />
      <span className="type-caption text-fg-2 min-w-0 flex-1">
        <span className="text-fg font-medium">Viewing as {role}.</span> Your
        activity here is a staff sandbox and stays hidden from {audience} and
        results.
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() =>
          void navigate({ to: "/o/$orgSlug/admin", params: { orgSlug } })
        }
      >
        <Icon icon={XIcon} />
        Exit
      </Button>
    </div>
  );
}
