import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

export function CardButtons({ username }: { username: string }) {
  return (
    <div className="flex gap-2 flex-col sm:shrink-0">
      <Button variant="outline" size="xs" className="gap-2">
        Follow
      </Button>
      <Button
        size="xs"
        render={<Link to="/explore/$username" params={{ username }} />}
      >
        View
      </Button>
    </div>
  );
}
