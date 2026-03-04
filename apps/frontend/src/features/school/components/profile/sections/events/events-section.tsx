import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { formatDate } from "@/components/utils/format";
import type { SchoolProfile } from "@/features/school/types";
import { Link } from "@tanstack/react-router";
import { CalendarIcon, MapPinIcon } from "lucide-react";
import { useProfile } from "../../context/use-profile";
import { EventDialog } from "./event-dialog";

const PAGE_SIZE = 3;

interface EventsSectionProps {
  events: SchoolProfile["events"];
}

export function EventsSection({ events }: EventsSectionProps) {
  const { showOwnerControls } = useProfile();

  const [page, setPage] = useState(1);

  const upcomingEvents = events
    .filter((e) => new Date(e.startDatetime) >= new Date())
    .sort(
      (a, b) =>
        new Date(a.startDatetime).getTime() -
        new Date(b.startDatetime).getTime(),
    );

  const totalResults = upcomingEvents.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalResults);
  const paginatedEvents = upcomingEvents.slice(startIndex, endIndex);

  return (
    <Frame className="h-fit w-full">
      <FrameHeader>
        <FrameTitle className="flex items-center justify-between gap-2">
          Hosting Events
          {showOwnerControls ? (
            <EventDialog />
          ) : (
            <div className="h-7 w-fit sm:h-6" />
          )}
        </FrameTitle>
      </FrameHeader>
      <FramePanel className="p-0!">
        {upcomingEvents.length > 0 ? (
          <div className="flex flex-col divide-y">
            {paginatedEvents.map((event) => (
              <div
                key={event.id}
                className="hover:bg-accent/50 flex items-center justify-between gap-1 px-4 py-2"
              >
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="brand" className="capitalize">
                      {event.type}
                    </Badge>
                    <span className="truncate text-sm font-medium">
                      {event.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground flex items-center gap-1 text-xs text-nowrap">
                      <CalendarIcon className="text-brand size-3 shrink-0" />
                      {formatDate(event.startDatetime)}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      &middot;
                    </span>
                    <span className="text-muted-foreground flex items-center gap-1 truncate text-xs">
                      <MapPinIcon className="text-brand size-3 shrink-0" />
                      {event.location}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {showOwnerControls && <EventDialog event={event} />}
                  <Button
                    variant="outline"
                    size="xs"
                    render={
                      <Link
                        to={"/events/$eventId"}
                        params={{ eventId: event.id }}
                      />
                    }
                  >
                    View
                  </Button>
                </div>
              </div>
            ))}

            {totalPages > 1 && (
              <Pagination className="px-4 py-3">
                <PaginationContent className="w-full justify-between gap-2">
                  <PaginationItem>
                    <PaginationPrevious
                      className="sm:*:[svg]:hidden"
                      render={
                        <Button
                          disabled={currentPage === 1}
                          onClick={() =>
                            currentPage > 1 && setPage(currentPage - 1)
                          }
                          size="sm"
                          variant="outline"
                        />
                      }
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <span className="text-muted-foreground text-sm">
                      {totalResults} Results
                    </span>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      className="sm:*:[svg]:hidden"
                      render={
                        <Button
                          disabled={currentPage === totalPages}
                          onClick={() =>
                            currentPage < totalPages && setPage(currentPage + 1)
                          }
                          size="sm"
                          variant="outline"
                        />
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        ) : (
          <div className="text-muted-foreground p-4 text-sm">
            No upcoming events
          </div>
        )}
      </FramePanel>
    </Frame>
  );
}
