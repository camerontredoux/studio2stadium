import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { UserPlusIcon } from "lucide-react";

export function CardButtons({ username }: { username: string }) {
  return (
    <div className="flex gap-2 flex-col sm:shrink-0">
      <Button variant="outline" size="xs" className="gap-2">
        <UserPlusIcon /> Follow
      </Button>
      <Button
        size="xs"
        className="hidden sm:flex"
        render={<Link to="/explore/$username" params={{ username }} />}
      >
        View Profile
      </Button>
    </div>
  );
}
