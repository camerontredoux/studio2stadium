import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function ProfilePicture({
  avatar,
  fallback,
}: {
  avatar: string | null;
  fallback: string;
}) {
  return (
    <Avatar className="bg-background left-4 z-20 size-20 rounded-full border object-cover shadow-xs sm:absolute sm:top-29 sm:size-24">
      <AvatarImage
        src={avatar || undefined}
        alt="Profile picture"
        className="size-full object-cover"
      />
      <AvatarFallback className="text-primary flex items-center justify-center text-lg">
        {fallback}
      </AvatarFallback>
    </Avatar>
  );
}
