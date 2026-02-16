import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function CardAvatar({
  username,
  avatar,
}: {
  username: string;
  avatar: string | null;
}) {
  return (
    <Avatar className="size-9 shrink-0 shadow-sm sm:size-16 sm:rounded-2xl">
      <AvatarImage src={avatar || undefined} />
      <AvatarFallback>{username.slice(0, 2).toUpperCase()}</AvatarFallback>
    </Avatar>
  );
}
