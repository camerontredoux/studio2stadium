import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/components/utils/cn";
import { initials } from "@/features/org/live/admin/rosters/detail-sheet/roster-sheet-model";

/** A person's profile picture, or their initials when they have none. */
export function PersonAvatar({
  firstName,
  lastName,
  src,
  className,
}: {
  firstName: string | null | undefined;
  lastName: string | null | undefined;
  src: string | null | undefined;
  className?: string;
}) {
  return (
    <Avatar className={cn("bg-surface-chip size-8 shrink-0", className)}>
      <AvatarImage src={src ?? undefined} alt="" />
      <AvatarFallback className="bg-surface-chip text-fg-2 type-meta">
        {initials(firstName, lastName)}
      </AvatarFallback>
    </Avatar>
  );
}
