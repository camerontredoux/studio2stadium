import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ApiSchemas } from "@/lib/api/client";

type User = ApiSchemas["SchoolsResponse"][number]["user"];

export function CardAvatar({ user }: { user: User }) {
  return (
    <Avatar className="size-14 shrink-0 rounded-xl shadow-sm sm:size-16">
      <AvatarImage src={user?.avatar || undefined} />
      <AvatarFallback>
        {user?.username.slice(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}
