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

type DancerPagination = ApiSchemas["DancersResponse"]["pagination"];

export function DancerPagination({
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
    <Pagination>
      <PaginationContent>
        {/* First page button (not on last page) */}
        {showFirstPageChevron && (
          <PaginationItem>
            <PaginationLink
              render={
                <Link
                  to="/dancers"
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

        {/* Previous page button */}
        {pagination.hasPreviousPage && (
          <PaginationItem>
            <PaginationLink
              render={
                <Link
                  to="/dancers"
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

        {/* First page + ellipsis (only on last page) */}
        {showFirstPageWithEllipsis && (
          <>
            <PaginationItem>
              <PaginationLink
                render={
                  <Link
                    to="/dancers"
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

        {/* Page numbers */}
        {pages.map((page) => (
          <PaginationItem key={page}>
            <PaginationLink
              isActive={page === currentPage}
              render={
                page !== currentPage ? (
                  <Link
                    to="/dancers"
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

        {/* Ellipsis + last page (only on first page) */}
        {showLastPageWithEllipsis && (
          <>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink
                render={
                  <Link
                    to="/dancers"
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

        {/* Next page button */}
        {pagination.hasNextPage && (
          <PaginationItem>
            <PaginationLink
              render={
                <Link
                  to="/dancers"
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

        {/* Last page button (not on first page) */}
        {showLastPageChevron && (
          <PaginationItem>
            <PaginationLink
              render={
                <Link
                  to="/dancers"
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
  );
}
