import { Label } from "@/components/event/label";
import { Panel, PanelHead } from "@/components/event/panel";
import { useAdminEvent } from "@/features/org/context/use-admin-event";
import { CallbacksStatusDot } from "@/features/org/live/shared/callbacks-status-dot";
import { SubpageHeader } from "@/features/org/live/shared/event-header";
import { ShellPage } from "@/features/org/live/shared/shell-slots";

import { PublishedShowcase, ShowcaseGroup } from "./showcase-group";
import { useShowcaseControls } from "./use-showcase-controls";

/**
 * /admin/callbacks: the full-page Callbacks widget. The current showcase with its
 * totals and every called-back dancer (bibs open the dancer dialog), then the
 * published showcases. "Publish" or "Next showcase" sits in the header.
 * Callbacks belong to the org's active event, so the crumb names that event.
 */
export function CallbacksPage({ orgSlug }: { orgSlug: string }) {
  const { events } = useAdminEvent();
  const activeEvent = events.find((e) => e.isActive) ?? null;
  const {
    current,
    totals,
    showcase,
    bibs,
    total,
    more,
    isPublished,
    earlier,
    primaryAction,
    dialogs,
  } = useShowcaseControls(orgSlug, {
    size: "md",
    primary: true,
  });

  return (
    <ShellPage
      header={
        <SubpageHeader
          event={activeEvent}
          title={
            <span className="inline-flex items-center gap-(--space-8)">
              Callbacks
              <CallbacksStatusDot />
            </span>
          }
          dashboardTo="/o/$orgSlug/admin"
          showStatus
          actions={primaryAction}
        />
      }
    >
      <Panel aria-label="Current showcase">
        <PanelHead
          label="Current showcase"
          count={showcase ? `#${showcase.number}` : undefined}
        />
        {!showcase ? (
          <p className="type-body text-fg-3 m-0 px-(--space-14) py-(--space-16)">
            {current.isError ? "Couldn't load callbacks." : "Loading…"}
          </p>
        ) : (
          <>
            {totals && (
              <dl className="border-line m-0 grid grid-cols-3 border-b">
                <Total label="Schools" value={totals.totalSchools} />
                <Total label="Dancers" value={totals.totalDancers} />
                <Total label="Called back" value={totals.uniqueCallbacks} />
              </dl>
            )}
            <ShowcaseGroup
              showcase={showcase}
              bibs={bibs}
              more={more}
              note={
                !isPublished && total > 0
                  ? "Dancers can't see these until you publish."
                  : !isPublished
                    ? "Dancers appear here as coaches call them back."
                    : undefined
              }
            />
          </>
        )}
      </Panel>

      {earlier.length > 0 && (
        <Panel aria-label="Published showcases">
          <PanelHead label="Published showcases" count={earlier.length} />
          {earlier.map((s) => (
            <PublishedShowcase
              key={s.id}
              orgSlug={orgSlug}
              showcase={s}
              enabled
            />
          ))}
        </Panel>
      )}
      {dialogs}
    </ShellPage>
  );
}

function Total({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-line flex min-w-0 flex-col gap-(--space-4) border-r px-(--space-14) py-(--space-12) last:border-r-0">
      <dt>
        <Label className="block truncate">{label}</Label>
      </dt>
      <dd className="type-display-stat text-fg m-0 tabular-nums">{value}</dd>
    </div>
  );
}
