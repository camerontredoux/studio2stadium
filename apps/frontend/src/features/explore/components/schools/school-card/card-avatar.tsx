import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ApiSchemas } from "@/lib/api/client";

type User = ApiSchemas["SchoolsResponse"][number]["user"];

export function CardAvatar({ user }: { user: User }) {
  return (
    <Avatar className="size-9 shrink-0 shadow-sm sm:size-16 sm:rounded-2xl">
      <AvatarImage src={user?.avatar || undefined} />
      <AvatarFallback>
        {user?.username.slice(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}
