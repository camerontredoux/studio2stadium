import { MegaphoneIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";

import { Chip } from "@/components/event/chip";
import { Widget } from "@/components/event/shell";
import { useWidgetBoardSlot } from "@/components/event/shell/widget-board-context";
import { useOrg } from "@/features/org/context/use-org";
import type { OrgEvent } from "@/features/org/api/admin-queries";
import { CallbacksStatusDot } from "@/features/org/live/shared/callbacks-status-dot";

import { PublishedShowcase, ShowcaseGroup } from "./showcase-group";
import { useShowcaseControls } from "./use-showcase-controls";

const PEEK_CHIPS = 6;

/**
 * Callbacks (Main.dc.html L810), on the showcase model: each showcase is a round of
 * callbacks. The current one is "In progress" until an admin publishes it; earlier
 * ones are "Published". Peek: the current showcase and its first bibs. Open: the
 * current showcase, then the published ones, each with its dancers as bib chips that
 * open the dancer dialog. The mockup's "New callback" is replaced by the showcase
 * flow from the old callbacks page: Publish (with its confirm) and Next showcase.
 *
 * Callbacks always belong to the org's active event (the API has no event param),
 * so on any other event the widget is disabled, as it is without the `callbacks`
 * feature.
 */
export function CallbacksWidget({
  orgSlug,
  event,
}: {
  orgSlug: string;
  event: OrgEvent;
}) {
  const { hasFeature } = useOrg();
  if (!hasFeature("callbacks") || !event.isActive) {
    return (
      <Widget
        id="callbacks"
        label="Callbacks"
        icon={MegaphoneIcon}
        disabled
        disabledText={
          hasFeature("callbacks")
            ? "Callbacks run on the active event"
            : "Not included in this event"
        }
      />
    );
  }
  return <ActiveCallbacksWidget orgSlug={orgSlug} />;
}

function ActiveCallbacksWidget({ orgSlug }: { orgSlug: string }) {
  const slot = useWidgetBoardSlot("callbacks");
  const isOpen = slot?.state === "open";
  const {
    current,
    showcase,
    bibs,
    isPublished,
    earlier,
    primaryAction,
    dialogs,
  } = useShowcaseControls(orgSlug);

  const fullPage = showcase ? (
    <Link to="/o/$orgSlug/admin/callbacks" params={{ orgSlug }} />
  ) : undefined;

  return (
    <>
      <Widget
        id="callbacks"
        label="Callbacks"
        icon={MegaphoneIcon}
        labelAddon={<CallbacksStatusDot />}
        count={showcase ? bibs.length : undefined}
        peek={
          showcase ? (
            <>
              <span className="flex min-w-0 flex-col gap-(--space-2)">
                <span className="text-fg truncate text-[13px] leading-[1.4] font-medium">
                  Showcase {showcase.number}
                </span>
                <span className="text-fg-3 truncate font-mono text-[11.5px] leading-[1.4]">
                  {isPublished ? "Published" : "In progress"} · {bibs.length}{" "}
                  called back
                </span>
              </span>
              {/* No chip row without bibs, so the text sits at the bottom. */}
              {bibs.length > 0 && (
                <span className="bp-phone:hidden flex flex-wrap gap-(--space-4)">
                  {bibs.slice(0, PEEK_CHIPS).map((bib) => (
                    <Chip key={bib.dancerRosterId} mono className="h-[22px]">
                      {bib.bibNumber ?? "—"}
                    </Chip>
                  ))}
                  {bibs.length > PEEK_CHIPS && (
                    <span className="text-fg-3 self-center font-mono text-[11.5px]">
                      +{bibs.length - PEEK_CHIPS}
                    </span>
                  )}
                </span>
              )}
            </>
          ) : (
            <span className="text-fg-3 text-[12.5px]">
              {current.isError ? "Couldn't load callbacks" : "Loading…"}
            </span>
          )
        }
        actions={primaryAction}
        fullPage={fullPage}
      >
        {showcase && (
          <div className="flex flex-col">
            <ShowcaseGroup
              showcase={showcase}
              bibs={bibs}
              note={
                !isPublished && bibs.length > 0
                  ? "Dancers can't see these until you publish."
                  : undefined
              }
            />
            {earlier.map((s) => (
              <PublishedShowcase
                key={s.id}
                orgSlug={orgSlug}
                showcase={s}
                enabled={isOpen}
              />
            ))}
          </div>
        )}
      </Widget>
      {dialogs}
    </>
  );
}
