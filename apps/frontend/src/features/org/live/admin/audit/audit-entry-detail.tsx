import { useQuery } from "@tanstack/react-query";

import { AuditDiff, AuditLogRow } from "@/components/event/audit-diff";
import { Button } from "@/components/event/button";
import { Label } from "@/components/event/label";
import { cn } from "@/components/utils/cn";
import {
  auditQueries,
  type AuditLogChildEntry,
  type AuditLogEntry,
} from "@/features/org/api/audit-queries";
import { DancerBib } from "@/features/org/live/shared/dancer-bib";

import {
  ACTION_LABELS,
  absoluteTime,
  buildAuditDiff,
  displayAction,
  relativeTime,
  RESOURCE_LABELS,
  summarizeEntry,
} from "./audit-format";

function EntryDiff({
  entry,
  timeZone,
}: {
  entry: AuditLogEntry | AuditLogChildEntry;
  timeZone?: string | null;
}) {
  const diff = buildAuditDiff(entry, timeZone);
  if (diff.rows.length === 0 && diff.unchanged.length === 0) {
    return <p className="type-caption text-fg-3">No details recorded.</p>;
  }
  return (
    <AuditDiff
      variant={diff.variant}
      valuesLabel={diff.valuesLabel}
      rows={diff.rows}
      unchanged={diff.unchanged}
    />
  );
}

function metaLine(
  entry: AuditLogEntry | AuditLogChildEntry,
  timeZone?: string | null,
) {
  const resource = RESOURCE_LABELS[entry.resource] ?? entry.resource;
  return [absoluteTime(entry.createdAt, timeZone), resource, entry.resourceId]
    .filter(Boolean)
    .join(" · ");
}

// Child rows: chevron, action, summary, time. The rows' own 14px side padding
// is cancelled by a matching negative margin (the grid carries the padding), so
// a subgrid's edge tracks keep their width instead of losing it to the padding.
// Phones drop the action track: action and time share the first line and the
// summary wraps below.
const childGrid =
  "grid grid-cols-[16px_112px_minmax(0,1fr)_max-content] gap-x-(--space-12) px-(--space-14) bp-phone:grid-cols-[16px_minmax(0,1fr)_max-content] bp-phone:gap-x-(--space-10)";

function ChildEntries({
  entry,
  orgSlug,
  eventId,
  timeZone,
  now,
}: {
  entry: AuditLogEntry;
  orgSlug: string;
  eventId: string;
  timeZone?: string | null;
  now: Date;
}) {
  const query = useQuery(auditQueries.children(orgSlug, eventId, entry.id));
  const children = (query.data?.data ?? []) as AuditLogChildEntry[];

  return (
    <div className="flex max-w-[880px] flex-col gap-(--space-8)">
      <Label className="text-fg-3">
        Entries in this change · {entry.childCount}
      </Label>
      {query.isPending ? (
        <p className="type-caption text-fg-3">Loading entries…</p>
      ) : query.isError ? (
        <div className="flex items-center gap-(--space-10)">
          <p className="type-caption text-fg-3">Couldn’t load these entries.</p>
          <Button size="sm" onClick={() => query.refetch()}>
            Try again
          </Button>
        </div>
      ) : (
        <div
          className={cn(
            childGrid,
            "border-line bg-bg-300 overflow-hidden rounded-(--radius-8) border",
          )}
        >
          {children.map((child) => {
            const action = displayAction(child);
            return (
              <AuditLogRow
                key={child.id}
                className="-mx-(--space-14)"
                rowClassName="min-h-9 bg-transparent bp-phone:gap-y-(--space-2) bp-phone:py-(--space-8)"
                summary={
                  <>
                    <span
                      className={cn(
                        "type-label bp-phone:col-start-2 bp-phone:row-start-1 truncate",
                        action === "delete" ? "text-danger" : "text-fg",
                      )}
                    >
                      {ACTION_LABELS[action]}
                    </span>
                    <span className="text-fg-2 bp-phone:col-[2/-1] bp-phone:row-start-2 bp-phone:whitespace-normal bp-phone:[overflow-wrap:anywhere] truncate">
                      {summarizeEntry(child, timeZone)}
                    </span>
                    <span
                      className="type-data-sm text-fg-3 bp-phone:col-start-3 bp-phone:row-start-1 whitespace-nowrap"
                      title={absoluteTime(child.createdAt, timeZone)}
                    >
                      {relativeTime(child.createdAt, now)}
                    </span>
                  </>
                }
              >
                <div className="flex flex-col gap-(--space-10)">
                  <span className="type-meta text-fg-3">
                    {metaLine(child, timeZone)}
                  </span>
                  <EntryDiff entry={child} timeZone={timeZone} />
                </div>
              </AuditLogRow>
            );
          })}
        </div>
      )}
    </div>
  );
}

export type AuditEntryDetailProps = {
  entry: AuditLogEntry;
  orgSlug: string;
  eventId: string;
  /** The event's IANA time zone, for exact times. */
  timeZone?: string | null;
  now: Date;
};

/**
 * What an expanded audit row shows: the exact time and record id, the dancer
 * it's about (their bib opens the dancer dialog), the diff, and any entries
 * recorded under it (bulk uploads).
 */
export function AuditEntryDetail({
  entry,
  orgSlug,
  eventId,
  timeZone,
  now,
}: AuditEntryDetailProps) {
  const subject = entry.subject;
  return (
    <div className="flex flex-col gap-(--space-10)">
      <div className="flex flex-wrap items-center gap-x-(--space-10) gap-y-(--space-6)">
        <span className="type-meta text-fg-3 [overflow-wrap:anywhere]">
          {metaLine(entry, timeZone)}
        </span>
        {subject && (
          <DancerBib
            variant="chip"
            dancer={{
              rosterId: subject.rosterId,
              bibNumber: subject.bibNumber,
              firstName: subject.firstName,
              lastName: subject.lastName,
              email: subject.email,
              eventId,
            }}
          />
        )}
      </div>
      <EntryDiff entry={entry} timeZone={timeZone} />
      {entry.childCount > 0 && (
        <ChildEntries
          entry={entry}
          orgSlug={orgSlug}
          eventId={eventId}
          timeZone={timeZone}
          now={now}
        />
      )}
    </div>
  );
}
