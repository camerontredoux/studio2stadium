import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Link, useNavigate } from "@tanstack/react-router";
import { GraduationCapIcon } from "lucide-react";
import { HiOutlineCalendar } from "react-icons/hi";

export function DancerEmpty() {
  const navigate = useNavigate();

  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <GraduationCapIcon />
        </EmptyMedia>
        <EmptyTitle>No dancers found</EmptyTitle>
        <EmptyDescription>Try different search criteria.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => navigate({ to: "/dancers" })}>
            Reset filters
          </Button>
          <Button size="sm" variant="outline" render={<Link to="/events" />}>
            <HiOutlineCalendar />
            View events
          </Button>
        </div>
      </EmptyContent>
    </Empty>
  );
}
