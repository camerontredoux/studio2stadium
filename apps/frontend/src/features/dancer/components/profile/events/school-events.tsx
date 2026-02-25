import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { formatDate } from "@/components/utils/format";
import type { ApiSchemas } from "@/lib/api/client";
import { Link } from "@tanstack/react-router";
import { CalendarIcon, MapPinIcon } from "lucide-react";

const PAGE_SIZE = 3;

type Events = ApiSchemas["DancersIdResponse"]["events"];

export function SchoolEvents({ events }: { events: Events }) {
  const [page, setPage] = useState(1);

  if (events.length === 0) {
    return (
      <div className="text-muted-foreground p-4 text-sm">
        Not attending any events
      </div>
    );
  }

  const totalResults = events.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalResults);
  const paginatedEvents = events.slice(startIndex, endIndex);

  return (
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
              <span className="text-muted-foreground text-sm">&middot;</span>
              <span className="text-muted-foreground flex items-center gap-1 truncate text-xs">
                <MapPinIcon className="text-brand size-3 shrink-0" />
                {event.location}
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            render={
              <Link to={"/events/$eventId"} params={{ eventId: event.id }} />
            }
          >
            View
          </Button>
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
                    onClick={() => currentPage > 1 && setPage(currentPage - 1)}
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
  );
}
