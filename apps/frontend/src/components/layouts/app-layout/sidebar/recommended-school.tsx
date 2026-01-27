import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

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
    <div className="px-5 py-4 hover:bg-accent">
      <div className="flex items-center gap-3">
        <Avatar className="size-12 rounded-xl self-start">
          <AvatarImage src="https://github.com/shadcn.png" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-1">
          <Button
            variant="link"
            className="p-0 text-sm font-semibold"
            render={
              <Link
                to="/school/$username"
                params={{
                  username: "usc-kaufman",
                }}
              />
            }
          >
            USC Kaufman
          </Button>
          <p className="text-xs text-muted-foreground">Los Angeles, CA</p>
        </div>
        <Button className="ml-auto" size="xs">
          Follow
        </Button>
      </div>
    </div>
  );
}
