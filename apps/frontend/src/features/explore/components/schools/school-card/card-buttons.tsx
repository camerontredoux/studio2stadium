import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { UserPlus2 } from "lucide-react";

export function CardButtons({ username }: { username: string | undefined }) {
  return (
    <div className="flex flex-col gap-2 sm:shrink-0">
      <Button variant="outline" size="xs" className="gap-2">
        <UserPlus2 /> Follow
      </Button>
      {username && (
        <Button
          size="xs"
          render={<Link to="/explore/$username" params={{ username }} />}
        >
          Profile
        </Button>
      )}
    </div>
  );
}
