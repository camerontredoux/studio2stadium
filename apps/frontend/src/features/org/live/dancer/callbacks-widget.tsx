import { MegaphoneIcon } from "@phosphor-icons/react";

import { Chip } from "@/components/event/chip";
import { Widget } from "@/components/event/shell";
import { Stat } from "@/components/event/stat";
import { Tag } from "@/components/event/tag";
import { CallbacksStatusDot } from "@/features/org/live/shared/callbacks-status-dot";

import {
  coachLabel,
  initials,
  rankForCallback,
  schoolLabel,
  showcaseText,
} from "./dancer-scouting";
import type { DancerScouting } from "./use-dancer-scouting";

/** The peek lists at most this many school names under the count. */
const PEEK_NAMES = 3;

/**
 * The dancer's Callbacks widget: the schools that called them back across the
 * event's published showcases, kept fresh by the dancer sidebar's realtime
 * subscription. Locked without the `callbacks` feature.
 */
export function CallbacksWidget({
  scouting,
  id = "callbacks",
}: {
  scouting: DancerScouting;
  id?: string;
}) {
  const { callbacksOn, callbacks, callbacksReleased, selections } = scouting;
  const count = callbacks.length;
  const word = count === 1 ? "school callback" : "school callbacks";

  return (
    <Widget
      id={id}
      label="Callbacks"
      icon={MegaphoneIcon}
      disabled={!callbacksOn}
      disabledText="Not included in this event"
      labelAddon={callbacksOn ? <CallbacksStatusDot /> : undefined}
      count={callbacksOn ? count : undefined}
      peek={
        <>
          <Stat
            value={count}
            caption={callbacksReleased || count > 0 ? word : "not released yet"}
          />
          {count > 0 && (
            <span className="bp-phone:hidden flex flex-col gap-(--space-2)">
              {callbacks.slice(0, PEEK_NAMES).map((callback) => (
                <span
                  key={callback.coachRosterId}
                  className="text-fg-2 truncate text-[12.5px]"
                >
                  {schoolLabel(callback.organization)}
                </span>
              ))}
            </span>
          )}
        </>
      }
    >
      {callbacksOn &&
        (count === 0 ? (
          <div className="flex min-h-full flex-col items-center justify-center gap-(--space-4) p-(--space-24) text-center">
            <span className="type-body text-fg-3">
              {callbacksReleased
                ? "No callbacks yet"
                : "Callbacks haven’t been released yet"}
            </span>
            {!callbacksReleased && (
              <span className="type-caption text-fg-disabled max-w-[320px]">
                Schools that call you back appear here once the organizer
                publishes a showcase.
              </span>
            )}
          </div>
        ) : (
          <ul className="m-0 flex list-none flex-col p-0">
            {callbacks.map((callback) => {
              const rank = rankForCallback(callback, selections);
              return (
                <li
                  key={callback.coachRosterId}
                  className="border-line-soft flex flex-col gap-(--space-8) border-b px-(--space-14) py-(--space-12)"
                >
                  <div className="flex min-w-0 items-center gap-(--space-8)">
                    <span className="truncate text-[13px] font-medium">
                      {schoolLabel(callback.organization)}
                    </span>
                    {rank !== null && (
                      <span className="text-fg-3 flex-none font-mono text-[11.5px]">
                        Choice {rank}
                      </span>
                    )}
                    <span className="flex-1" />
                    {/* Callbacks carry the showcases they came from, not a time. */}
                    <Tag className="flex-none">
                      {showcaseText(callback.showcaseNumbers) ?? "Called"}
                    </Tag>
                  </div>
                  <div className="flex flex-wrap gap-(--space-6)">
                    <Chip sub={initials(callback)}>{coachLabel(callback)}</Chip>
                  </div>
                </li>
              );
            })}
          </ul>
        ))}
    </Widget>
  );
}
