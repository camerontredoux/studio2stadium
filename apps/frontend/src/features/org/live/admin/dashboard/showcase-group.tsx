import { ArrowCounterClockwiseIcon } from "@phosphor-icons/react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";

import { Button } from "@/components/event/button";
import { Icon } from "@/components/event/icon";
import { Tag } from "@/components/event/tag";
import { scoutingQueries } from "@/features/org/api/scouting-queries";
import { DancerBib } from "@/features/org/live/shared/dancer-bib";

import { agoLabel } from "./age";
import { sentCallbacksKey, setSent, useSentCallbacks } from "./sent-callbacks";

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
  eventId: string;
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

/** Admins call dancers back five at a time, so the chips sit in groups of five. */
const GROUP_SIZE = 5;

function groupsOfFive<T>(items: T[]) {
  const groups: T[][] = [];
  for (let i = 0; i < items.length; i += GROUP_SIZE) {
    groups.push(items.slice(i, i + GROUP_SIZE));
  }
  return groups;
}

/**
 * One showcase: title, when, status pill, then its dancers as bib chips in groups of five.
 * Opening a dancer marks the chip as sent (green) until its undo button clears it.
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
  const sentKey = sentCallbacksKey(showcase.eventId, showcase.id);
  const sent = useSentCallbacks(sentKey);
  return (
    <section
      aria-label={`Showcase ${showcase.number}`}
      className="border-line flex flex-col gap-(--space-8) border-b px-(--space-14) py-(--space-12) [contain-intrinsic-size:auto_240px] [content-visibility:auto] last:border-b-0"
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
      {bibs && bibs.length > 0 ? (
        <div className="flex flex-col gap-(--space-14)">
          {groupsOfFive(bibs).map((group) => (
            <div
              key={group[0].dancerRosterId}
              data-testid="callback-group"
              className="flex flex-wrap gap-(--space-6)"
            >
              {group.map((bib) => {
                const name = `${bib.firstName} ${bib.lastName}`.trim();
                const isSent = sent.has(bib.dancerRosterId);
                // The wrapper stays in place when the mark changes, so the chip keeps focus.
                return (
                  <span
                    key={bib.dancerRosterId}
                    data-sent={isSent ? "" : undefined}
                    className="inline-flex"
                  >
                    <DancerBib
                      variant="chip"
                      dancer={{
                        rosterId: bib.dancerRosterId,
                        bibNumber: bib.bibNumber,
                        firstName: bib.firstName,
                        lastName: bib.lastName,
                      }}
                      onOpen={() => setSent(sentKey, bib.dancerRosterId, true)}
                      className={
                        isSent
                          ? "border-live/40 bg-live/10 text-live hover:bg-live/15 hover:text-live [&>span]:text-live rounded-r-none"
                          : undefined
                      }
                    >
                      {name}
                      {bib.coachCount > 1 && (
                        <span className="text-count font-mono text-[11px]">
                          ×{bib.coachCount}
                        </span>
                      )}
                    </DancerBib>
                    {isSent && (
                      <Button
                        size="sm"
                        iconOnly
                        label={`Unmark ${name || "dancer"} as sent`}
                        onClick={(event) => {
                          // The button goes away, so hand focus back to its chip.
                          const chip =
                            event.currentTarget.previousElementSibling;
                          if (chip instanceof HTMLElement) chip.focus();
                          setSent(sentKey, bib.dancerRosterId, false);
                        }}
                        className="border-live/40 bg-live/10 text-live hover:bg-live/20 hover:text-live rounded-l-none border-l-0"
                      >
                        <Icon icon={ArrowCounterClockwiseIcon} />
                      </Button>
                    )}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      ) : (
        <span className="text-fg-3 text-[12.5px]">
          {loading ? "Loading…" : "No dancers called back yet"}
        </span>
      )}
      {hasMore && (
        <span ref={end} className="text-fg-3 text-[12px]">
          {loadingMore ? "Loading more…" : null}
        </span>
      )}
    </section>
  );
}
