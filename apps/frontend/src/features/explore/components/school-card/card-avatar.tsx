import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { School } from "./school-card";

export function CardAvatar({ school }: { school: School }) {
  return (
    <Avatar className="size-16 rounded-xl shrink-0">
      <AvatarImage
        className="rounded-xl"
        src={school.user?.avatar ?? undefined}
      />
      <AvatarFallback className="rounded-xl">
        {school.user?.username.slice(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}
