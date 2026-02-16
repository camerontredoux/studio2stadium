import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { School } from "./dancer-card";

export function CardAvatar({ school }: { school: School }) {
  return (
    <Avatar className="size-16 shrink-0 rounded-xl">
      <AvatarImage className="rounded-xl" src={school.avatar ?? undefined} />
      <AvatarFallback className="rounded-xl">
        {school.username.slice(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}
