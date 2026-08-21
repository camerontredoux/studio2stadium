import { Link } from "@tanstack/react-router";
import { SchoolIcon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/components/utils/cn";
import { createAccess } from "@/lib/access/access";
import { useSession } from "@/lib/session";

/**
 * A school's profile picture, falling back to a school glyph for programs that
 * have not claimed an account or have not uploaded one.
 */
export function SchoolAvatar({
  avatarUrl,
  organization,
  className,
}: {
  avatarUrl: string | null;
  organization: string | null;
  className?: string;
}) {
  return (
    <Avatar className={cn("size-7 shrink-0 rounded-md", className)}>
      <AvatarImage
        src={avatarUrl ?? undefined}
        alt={organization ?? "School"}
        className="object-cover"
      />
      <AvatarFallback className="bg-muted rounded-md">
        <SchoolIcon className="text-muted-foreground size-3.5" />
      </AvatarFallback>
    </Avatar>
  );
}

/**
 * A school's name, linked to its profile.
 *
 * Two cases render as plain text instead of a link:
 *  - the school has never claimed an account, so there is no profile to open;
 *  - the viewer cannot open school profiles. `/explore/$username` guards on
 *    `is("core", "dancer")` or `self`, which platform admins bypass but org
 *    admins (platform role "user", type "school") do not. Linking regardless
 *    would send those admins to /unauthorized, so the policy is evaluated with
 *    the same helper the route uses rather than duplicated here.
 */
export function SchoolNameLink({
  username,
  organization,
  className,
}: {
  username: string | null;
  organization: string | null;
  className?: string;
}) {
  const session = useSession();
  const name = organization || "Unknown School";

  const access = createAccess(session);
  const canOpenProfile =
    username !== null &&
    access.any(access.is("core", "dancer"), access.self(username))();

  if (!username || !canOpenProfile) {
    return <span className={cn("truncate", className)}>{name}</span>;
  }

  return (
    <Link
      to="/explore/$username"
      params={{ username }}
      className={cn("truncate hover:underline", className)}
      onClick={(e) => e.stopPropagation()}
    >
      {name}
    </Link>
  );
}
