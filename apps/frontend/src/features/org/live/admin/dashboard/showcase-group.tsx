import { useQuery } from "@tanstack/react-query";

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
  const { data, isPending } = useQuery({
    ...scoutingQueries.publishedCallbacks(orgSlug, showcase.id),
    enabled,
  });
  return <ShowcaseGroup showcase={showcase} bibs={data} loading={isPending} />;
}

/** One showcase: title, when, status pill, then its dancers as bib chips. */
export function ShowcaseGroup({
  showcase,
  bibs,
  loading = false,
  note,
}: {
  showcase: Showcase;
  bibs: CallbackBib[] | undefined;
  loading?: boolean;
  note?: string;
}) {
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
                <span className="text-fg-3 font-mono text-[11px]">
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
    </section>
  );
}
