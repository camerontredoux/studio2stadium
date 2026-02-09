import { Button } from "@/components/ui/button";
import { UserPlus2 } from "lucide-react";

export function CardButtons({ username }: { username: string | undefined }) {
  return (
    <div className="flex flex-col gap-2 max-sm:hidden sm:shrink-0">
      <Button
        variant="outline"
        size="xs"
        className="gap-2"
        onClick={(e) => {
          e.preventDefault();
        }}
      >
        <UserPlus2 /> Follow
      </Button>
      {username && <Button size="xs">Profile</Button>}
    </div>
  );
}
