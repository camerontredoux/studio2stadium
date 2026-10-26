import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";

import { Tag } from "@/components/event/tag";
import { scoutingQueries } from "@/features/org/api/scouting-queries";
import { DancerBib } from "@/features/org/live/shared/dancer-bib";

import { agoLabel } from "./age";

export type CallbackBib = {
  dancerRosterId: string;
  bibNumber: number | null;
  firstName: string;
  lastName: string;
  coachCount: number;
};

/** Loads the next page of chips as the end of the list nears the viewport. */
export type LoadMore = {
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
};

export type Showcase = {
  id: string;
  number: number;
  status: string;
  createdAt: string;
  publishedAt: string | null;
};

/** "Published · 35m ago" or "In progress · started 35m ago". */
function showcaseMeta(showcase: Showcase) {
  return showcase.status === "published" && showcase.publishedAt
    ? `Published ${agoLabel(showcase.publishedAt)}`
    : `Started ${agoLabel(showcase.createdAt)}`;
}

export function PublishedShowcase({
  orgSlug,
  showcase,
  enabled,
}: {
  orgSlug: string;
  showcase: Showcase;
  enabled: boolean;
}) {
  const query = useInfiniteQuery({
    ...scoutingQueries.publishedCallbackPages(orgSlug, showcase.id),
    enabled,
  });
  const pages = query.data?.pages;
  const bibs = useMemo(() => pages?.flatMap((page) => page.data), [pages]);
  return (
    <ShowcaseGroup
      showcase={showcase}
      bibs={bibs}
      loading={query.isPending}
      more={{
        hasMore: query.hasNextPage && !query.isFetchNextPageError,
        loadingMore: query.isFetchingNextPage,
        onLoadMore: () => void query.fetchNextPage(),
      }}
    />
  );
}

/**
 * One showcase: title, when, status pill, then its dancers as bib chips.
 * The chips wrap at their own widths, so they aren't virtualized; they arrive a
 * page at a time as the end scrolls into view.
 */
export function ShowcaseGroup({
  showcase,
  bibs,
  loading = false,
  note,
  more,
}: {
  showcase: Showcase;
  bibs: CallbackBib[] | undefined;
  loading?: boolean;
  note?: string;
  more?: LoadMore;
}) {
  const end = useRef<HTMLSpanElement>(null);
  const hasMore = !!more?.hasMore;
  const loadingMore = !!more?.loadingMore;
  const onLoadMore = more?.onLoadMore;
  useEffect(() => {
    const el = end.current;
    if (!el || !hasMore || loadingMore || !onLoadMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) onLoadMore();
      },
      { rootMargin: "400px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, onLoadMore]);
  const published = showcase.status === "published";
  return (
    <section
      aria-label={`Showcase ${showcase.number}`}
      className="border-line flex flex-col gap-(--space-8) border-b px-(--space-14) py-(--space-12) last:border-b-0"
    >
      <div className="flex min-w-0 items-center gap-(--space-8)">
        <span className="text-fg shrink-0 text-[13px] font-medium">
          Showcase {showcase.number}
        </span>
        <span className="text-fg-3 min-w-0 truncate font-mono text-[11.5px]">
          {showcaseMeta(showcase)}
        </span>
        <span className="flex-1" />
        <Tag tone={published ? "muted" : "live"}>
          {published ? "Published" : "In progress"}
        </Tag>
      </div>
      {note && <p className="text-fg-3 m-0 text-[12px]">{note}</p>}
      <div className="flex flex-wrap gap-(--space-6)">
        {bibs && bibs.length > 0 ? (
          bibs.map((bib) => (
            <DancerBib
              key={bib.dancerRosterId}
              variant="chip"
              dancer={{
                rosterId: bib.dancerRosterId,
                bibNumber: bib.bibNumber,
                firstName: bib.firstName,
                lastName: bib.lastName,
              }}
            >
              {`${bib.firstName} ${bib.lastName}`.trim()}
              {bib.coachCount > 1 && (
                <span className="text-count font-mono text-[11px]">
                  ×{bib.coachCount}
                </span>
              )}
            </DancerBib>
          ))
        ) : (
          <span className="text-fg-3 text-[12.5px]">
            {loading ? "Loading…" : "No dancers called back yet"}
          </span>
        )}
      </div>
      {hasMore && (
        <span ref={end} className="text-fg-3 text-[12px]">
          {loadingMore ? "Loading more…" : null}
        </span>
      )}
    </section>
  );
}
