import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import type { ApiSchemas } from "@/lib/api/client";
import { Link } from "@tanstack/react-router";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

type DancerPagination = ApiSchemas["AdminDancersResponse"]["pagination"];

export function DancersPagination({
  pagination,
}: {
  pagination: DancerPagination;
}) {
  const lastPage = pagination.totalPages - 1;
  const currentPage = pagination.page;

  let startPage: number;
  if (currentPage === 0) {
    startPage = 0;
  } else if (currentPage === lastPage) {
    startPage = Math.max(0, lastPage - 2);
  } else {
    startPage = currentPage - 1;
  }

  const endPage = Math.min(startPage + 2, lastPage);

  const pages = Array.from(
    { length: Math.min(3, pagination.totalPages) },
    (_, i) => startPage + i,
  );

  const showLastPageWithEllipsis = currentPage === 0 && endPage < lastPage;
  const showLastPageChevron =
    pagination.hasNextPage && currentPage > 0 && currentPage < lastPage;

  const showFirstPageWithEllipsis = currentPage === lastPage && startPage > 0;
  const showFirstPageChevron =
    pagination.hasPreviousPage && currentPage > 0 && currentPage < lastPage;

  return (
    <div className="flex w-full items-center justify-between gap-2">
      <p className="text-muted-foreground whitespace-nowrap text-sm">
        Showing{" "}
        <strong className="text-foreground font-medium">
          {pagination.page * pagination.limit + 1}
        </strong>
        -
        <strong className="text-foreground font-medium">
          {Math.min(
            (pagination.page + 1) * pagination.limit,
            pagination.total,
          )}
        </strong>{" "}
        of{" "}
        <strong className="text-foreground font-medium">
          {pagination.total}
        </strong>{" "}
        dancers
      </p>
      <Pagination className="justify-end">
        <PaginationContent>
          {showFirstPageChevron && (
            <PaginationItem>
              <PaginationLink
                render={
                  <Link
                    to="/admin/dancers"
                    search={(search) => ({
                      ...search,
                      page: 0,
                    })}
                  />
                }
              >
                <ChevronsLeft className="size-4" />
              </PaginationLink>
            </PaginationItem>
          )}

          {pagination.hasPreviousPage && (
            <PaginationItem>
              <PaginationLink
                render={
                  <Link
                    to="/admin/dancers"
                    search={(search) => ({
                      ...search,
                      page: currentPage - 1,
                    })}
                  />
                }
              >
                <ChevronLeft className="size-4" />
              </PaginationLink>
            </PaginationItem>
          )}

          {showFirstPageWithEllipsis && (
            <>
              <PaginationItem>
                <PaginationLink
                  render={
                    <Link
                      to="/admin/dancers"
                      search={(search) => ({
                        ...search,
                        page: 0,
                      })}
                    />
                  }
                >
                  1
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            </>
          )}

          {pages.map((page) => (
            <PaginationItem key={page}>
              <PaginationLink
                isActive={page === currentPage}
                render={
                  page !== currentPage ? (
                    <Link
                      to="/admin/dancers"
                      search={(search) => ({
                        ...search,
                        page,
                      })}
                    />
                  ) : undefined
                }
              >
                {page + 1}
              </PaginationLink>
            </PaginationItem>
          ))}

          {showLastPageWithEllipsis && (
            <>
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink
                  render={
                    <Link
                      to="/admin/dancers"
                      search={(search) => ({
                        ...search,
                        page: lastPage,
                      })}
                    />
                  }
                >
                  {pagination.totalPages}
                </PaginationLink>
              </PaginationItem>
            </>
          )}

          {pagination.hasNextPage && (
            <PaginationItem>
              <PaginationLink
                render={
                  <Link
                    to="/admin/dancers"
                    search={(search) => ({
                      ...search,
                      page: currentPage + 1,
                    })}
                  />
                }
              >
                <ChevronRight className="size-4" />
              </PaginationLink>
            </PaginationItem>
          )}

          {showLastPageChevron && (
            <PaginationItem>
              <PaginationLink
                render={
                  <Link
                    to="/admin/dancers"
                    search={(search) => ({
                      ...search,
                      page: lastPage,
                    })}
                  />
                }
              >
                <ChevronsRight className="size-4" />
              </PaginationLink>
            </PaginationItem>
          )}
        </PaginationContent>
      </Pagination>
    </div>
  );
}
