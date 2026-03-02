import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { CalendarIcon } from "lucide-react";

export function EventEmpty() {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CalendarIcon />
        </EmptyMedia>
        <EmptyTitle>No events found</EmptyTitle>
        <EmptyDescription>Try different search criteria.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
