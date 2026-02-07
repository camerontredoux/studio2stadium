import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ApiSchemas } from "@/lib/api/client";

type User = ApiSchemas["SchoolsResponse"][number]["user"];

export function CardAvatar({ user }: { user: User }) {
  return (
    <Avatar className="size-16 shrink-0 rounded-xl">
      <AvatarImage className="rounded-xl" src={user?.avatar || undefined} />
      <AvatarFallback className="rounded-xl">
        {user?.username.slice(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}
