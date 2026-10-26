import {
  CaretDownIcon,
  CaretUpIcon,
  PlusIcon,
  StarIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useLayoutEffect, useRef } from "react";

import { Button } from "@/components/event/button";
import { Icon } from "@/components/event/icon";
import { Label } from "@/components/event/label";
import { Widget } from "@/components/event/shell";
import { Tag } from "@/components/event/tag";
import { cn } from "@/components/utils/cn";
import { PersonAvatar } from "@/features/org/live/shared/person-avatar";

import {
  buildCoachRows,
  choiceSlots,
  coachLabel,
  schoolLabel,
  sortCoachRows,
  UNLIMITED_SELECTIONS,
  callbackForSchool,
  type ChoiceSlot,
} from "./dancer-scouting";
import { choiceHint } from "./top-choice-copy";
import {
  isPendingSelection,
  type DancerScouting,
  type MoveDirection,
} from "./use-dancer-scouting";

const LOCKED_HINT = "Top choices can only be changed for the live event";

type MoveButtonRef = (
  selectionId: string,
  direction: MoveDirection,
) => (el: HTMLButtonElement | null) => void;

/** The peek shows at most this many slots. */
const PEEK_SLOTS = 3;

/**
 * The dancer's Top choices widget (school selections): the ranked slots on the
 * peek; open, the filled slots with remove, open slots, and every other school
 * with "Add". Locked without the `school_selections` feature.
 */
export function TopChoicesWidget({
  scouting,
  id = "top-choices",
}: {
  scouting: DancerScouting;
  id?: string;
}) {
  const { selectionsOn, selections, schools, max } = scouting;
  const slots = choiceSlots(selections, schools, max);
  const count =
    max === UNLIMITED_SELECTIONS
      ? `${selections.length}`
      : `${selections.length}/${max}`;

  return (
    <Widget
      id={id}
      label="Top choices"
      icon={StarIcon}
      disabled={!selectionsOn}
      disabledText="Not included in this event"
      count={selectionsOn ? count : undefined}
      peek={<TopChoicesPeek slots={slots} />}
    >
      {selectionsOn && <TopChoicesBody scouting={scouting} slots={slots} />}
    </Widget>
  );
}

function TopChoicesPeek({ slots }: { slots: ChoiceSlot[] }) {
  // Unlimited and still empty: three open lines, as with the default limit.
  const shown =
    slots.length === 0
      ? Array.from({ length: PEEK_SLOTS }, (_, i) => ({
          rank: i + 1,
          selection: null,
          school: null,
        }))
      : slots.slice(0, PEEK_SLOTS);
  return (
    <span className="flex flex-col gap-(--space-6)">
      {shown.map((slot) => (
        <span
          key={slot.rank}
          className="flex min-w-0 items-center gap-(--space-8)"
        >
          <span className="text-fg-3 w-[10px] flex-none font-mono text-[11px]">
            {slot.rank}
          </span>
          <span
            className={cn(
              "min-w-0 truncate text-[13px]",
              slot.selection ? "text-fg" : "text-fg-disabled",
            )}
          >
            {slot.selection ? schoolLabel(slot.selection.organization) : "–"}
          </span>
        </span>
      ))}
    </span>
  );
}

function TopChoicesBody({
  scouting,
  slots,
}: {
  scouting: DancerScouting;
  slots: ChoiceSlot[];
}) {
  const {
    schools,
    selections,
    callbacks,
    full,
    canEdit,
    max,
    add,
    remove,
    move,
    schoolsQuery,
  } = scouting;
  const hint = choiceHint({ canEdit, full, max });
  const others = sortCoachRows(
    buildCoachRows(schools, selections, callbacks).filter(
      (row) => row.rank === null,
    ),
    "school",
    "asc",
  );

  // Rows are keyed by slot, so a click leaves the pointer and its hover on the
  // same button while the schools swap. A keyboard move instead sends focus
  // after the school, or to its other arrow once it reaches an end.
  const moveButtons = useRef(new Map<string, HTMLButtonElement>());
  const pendingFocus = useRef<{ id: string; direction: MoveDirection } | null>(
    null,
  );
  const moveButtonRef: MoveButtonRef = (selectionId, direction) => (el) => {
    const key = `${selectionId}:${direction}`;
    if (el) moveButtons.current.set(key, el);
    else moveButtons.current.delete(key);
  };
  useLayoutEffect(() => {
    const target = pendingFocus.current;
    if (!target) return;
    pendingFocus.current = null;
    const opposite = target.direction === "up" ? "down" : "up";
    const same = moveButtons.current.get(`${target.id}:${target.direction}`);
    const other = moveButtons.current.get(`${target.id}:${opposite}`);
    (same && !same.disabled ? same : other)?.focus();
  });
  const filledCount = selections.length;

  return (
    <div className="flex flex-col">
      {slots.map((slot) =>
        slot.selection ? (
          <FilledSlot
            key={`slot-${slot.rank}`}
            slot={slot}
            last={slot.rank === filledCount}
            called={
              !!slot.school && !!callbackForSchool(slot.school, callbacks)
            }
            canEdit={canEdit}
            moveButtonRef={moveButtonRef}
            onMove={(direction, fromKeyboard) => {
              if (!slot.selection) return;
              if (fromKeyboard) {
                pendingFocus.current = { id: slot.selection.id, direction };
              }
              move(slot.selection, direction);
            }}
            onRemove={() => slot.selection && remove(slot.selection)}
          />
        ) : (
          <div
            key={`open-${slot.rank}`}
            className="border-line-soft flex min-h-14 items-center gap-(--space-12) border-b pr-(--space-8) pl-(--space-14)"
          >
            <span className="text-fg-3 w-[22px] flex-none font-mono text-[18px] font-medium">
              {slot.rank}
            </span>
            <span className="text-fg-disabled flex-1">Open slot</span>
          </div>
        ),
      )}
      <div className="bg-surface-head border-line-soft flex min-h-9 items-center border-b px-(--space-14)">
        <Label>Schools</Label>
      </div>
      {others.length === 0 ? (
        <p className="type-body text-fg-3 m-0 px-(--space-14) py-(--space-16)">
          {schoolsQuery.isLoading
            ? "Loading schools…"
            : schools.length === 0
              ? "No coaches have joined this event yet"
              : "Every school is in your top choices"}
        </p>
      ) : (
        others.map((row) => (
          <div
            key={row.school.rosterId}
            className="border-line-soft flex min-h-11 items-center gap-(--space-12) border-b pr-(--space-8) pl-(--space-14)"
          >
            <PersonAvatar
              firstName={row.school.firstName}
              lastName={row.school.lastName}
              src={row.school.avatarUrl}
              className="size-6"
            />
            <span className="flex min-w-0 flex-1 flex-col gap-px">
              <span className="truncate">{row.name}</span>
              {row.coach && (
                <span className="text-fg-3 truncate text-[12px]">
                  {row.coach}
                </span>
              )}
            </span>
            <Button
              size="sm"
              disabled={!canEdit || full}
              title={hint}
              aria-label={`Add ${row.name} to top choices`}
              onClick={() => add(row.school)}
            >
              <Icon icon={PlusIcon} />
              Add
            </Button>
          </div>
        ))
      )}
    </div>
  );
}

function FilledSlot({
  slot,
  last,
  called,
  canEdit,
  moveButtonRef,
  onMove,
  onRemove,
}: {
  slot: ChoiceSlot;
  /** The lowest-ranked filled slot, which can't move down. */
  last: boolean;
  called: boolean;
  canEdit: boolean;
  moveButtonRef: MoveButtonRef;
  /** `fromKeyboard` is true for Enter or Space, where focus follows the school. */
  onMove: (direction: MoveDirection, fromKeyboard: boolean) => void;
  onRemove: () => void;
}) {
  const selection = slot.selection;
  if (!selection) return null;
  const name = schoolLabel(selection.organization);
  const coach = slot.school ? coachLabel(slot.school) : "";
  // A school still being added has no server id to move or remove yet.
  const locked = !canEdit || isPendingSelection(selection);
  const title = canEdit ? undefined : LOCKED_HINT;

  return (
    <div className="border-line-soft flex min-h-14 items-center gap-(--space-12) border-b pr-(--space-8) pl-(--space-14)">
      <span className="text-fg w-[22px] flex-none font-mono text-[18px] font-medium">
        {slot.rank}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-px">
        <span className="truncate font-medium">{name}</span>
        {coach && (
          <span className="text-fg-3 truncate text-[12px]">{coach}</span>
        )}
      </span>
      {called && <Tag className="bp-phone:hidden flex-none">Called you</Tag>}
      <span className="flex flex-none gap-(--space-2)">
        <Button
          ref={moveButtonRef(selection.id, "up")}
          iconOnly
          variant="ghost"
          label={`Move ${name} up`}
          title={title}
          disabled={locked || slot.rank === 1}
          onClick={(e) => onMove("up", e.detail === 0)}
        >
          <Icon icon={CaretUpIcon} />
        </Button>
        <Button
          ref={moveButtonRef(selection.id, "down")}
          iconOnly
          variant="ghost"
          label={`Move ${name} down`}
          title={title}
          disabled={locked || last}
          onClick={(e) => onMove("down", e.detail === 0)}
        >
          <Icon icon={CaretDownIcon} />
        </Button>
        <Button
          iconOnly
          variant="ghost"
          label={`Remove ${name}`}
          title={title}
          disabled={locked}
          onClick={onRemove}
        >
          <Icon icon={XIcon} />
        </Button>
      </span>
    </div>
  );
}
