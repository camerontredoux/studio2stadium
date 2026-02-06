import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { MapPinIcon } from "lucide-react";

interface School {
  title: string;
  type: string;
  description: string;
  date: string;
  time: string;
  location: string;
}

export function RecommendedSchool({ school: _ }: { school?: School }) {
  return (
    <div className="hover:bg-accent px-5 py-4">
      <div className="flex items-center gap-3">
        <Avatar className="size-12 self-start rounded-xl">
          <AvatarImage src="https://github.com/shadcn.png" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-1">
          <Link
            className="hover:text-brand text-sm font-semibold underline underline-offset-4"
            to="/explore/$username"
            params={{
              username: "usc-kaufman",
            }}
          >
            USC Kaufman
          </Link>
          <p className="text-muted-foreground flex items-center gap-1 text-xs">
            <MapPinIcon className="size-3" /> Los Angeles, CA
          </p>
        </div>
        <Button className="ml-auto" size="xs" variant="outline">
          Follow
        </Button>
      </div>
    </div>
  );
}
