import {
  CaretDownIcon,
  CaretUpIcon,
  PlusIcon,
  StarIcon,
  XIcon,
} from "@phosphor-icons/react";
import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { useDebouncedCallback } from "@/components/hooks/use-debounced-callback";
import { Button } from "@/components/event/button";
import { Icon } from "@/components/event/icon";
import { Label } from "@/components/event/label";
import { Search } from "@/components/event/search";
import { Widget } from "@/components/event/shell";
import { Tag } from "@/components/event/tag";
import { cn } from "@/components/utils/cn";
import { scoutingQueries } from "@/features/org/api/scouting-queries";
import { PersonAvatar } from "@/features/org/live/shared/person-avatar";
import { useVirtualRows } from "@/features/org/live/shared/use-virtual-rows";
import { Spacer } from "@/features/org/live/shared/virtual-spacer";

import {
  buildCoachRows,
  choiceSlots,
  coachLabel,
  schoolLabel,
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
 * with "Add", a page at a time and searchable on the server. The dashboard leaves
 * it out without the `school_selections` feature.
 */
export function TopChoicesWidget({
  scouting,
  id = "top-choices",
}: {
  scouting: DancerScouting;
  id?: string;
}) {
  const { selections, max } = scouting;
  const slots = choiceSlots(selections, max);
  const count =
    max === UNLIMITED_SELECTIONS
      ? `${selections.length}`
      : `${selections.length}/${max}`;

  return (
    <Widget
      id={id}
      label="Top choices"
      icon={StarIcon}
      count={count}
      peek={<TopChoicesPeek slots={slots} />}
    >
      <TopChoicesBody scouting={scouting} slots={slots} />
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
    slug,
    eventId,
    selections,
    callbacks,
    full,
    canEdit,
    max,
    add,
    remove,
    move,
  } = scouting;
  const hint = choiceHint({ canEdit, full, max });

  // Type freely; the server searches every school after a pause.
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const commitSearch = useDebouncedCallback(
    (value: string) => setSearch(value.trim()),
    250,
  );
  const pages = useInfiniteQuery({
    ...scoutingQueries.schoolPages(slug, eventId, search),
    placeholderData: keepPreviousData,
    retry: false,
  });
  const total = pages.data?.pages[0]?.total ?? 0;
  // Ranked schools sit in the slots above, wherever they fall in the pages.
  const others = buildCoachRows(
    pages.data?.pages.flatMap((page) => page.data) ?? [],
    selections,
    callbacks,
  ).filter((row) => row.rank === null);

  const scrollRef = useRef<HTMLElement | null>(null);
  const [list, setList] = useState<HTMLDivElement | null>(null);
  const listRef = useCallback((el: HTMLDivElement | null) => {
    scrollRef.current = el?.closest<HTMLElement>(".s2s-widget-fbody") ?? null;
    setList(el);
  }, []);
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = pages;
  const loadMore = useCallback(() => void fetchNextPage(), [fetchNextPage]);
  const virtual = useVirtualRows({
    count: others.length,
    scrollRef,
    list,
    hasMore: hasNextPage,
    loadingMore: isFetchingNextPage,
    onLoadMore: loadMore,
    resetKey: search,
    boxOnly: true,
  });
  // A page of nothing but ranked schools leaves no row to scroll to.
  useEffect(() => {
    if (others.length === 0 && hasNextPage && !isFetchingNextPage) loadMore();
  }, [others.length, hasNextPage, isFetchingNextPage, loadMore]);

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
              !!callbackForSchool(
                {
                  rosterId: slot.selection.coachRosterId,
                  organization: slot.selection.organization,
                },
                callbacks,
              )
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
      <div className="bg-surface-head border-line-soft sticky top-0 z-1 flex min-h-9 items-center gap-(--space-12) border-b py-(--space-4) pr-(--space-8) pl-(--space-14)">
        <Label>Schools</Label>
        <Search
          placeholder="Search schools"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            commitSearch(e.target.value);
          }}
        />
      </div>
      {others.length === 0 ? (
        <p className="type-body text-fg-3 m-0 px-(--space-14) py-(--space-16)">
          {pages.isPending || hasNextPage
            ? "Loading schools…"
            : pages.isError
              ? "Couldn’t load schools"
              : total > 0
                ? "Every school is in your top choices"
                : search
                  ? `No schools match “${search}”`
                  : "No coaches have joined this event yet"}
        </p>
      ) : (
        <div ref={listRef}>
          <Spacer height={virtual.padTop} />
          {virtual.items.map((item) => {
            const row = others[item.index]!;
            return (
              <div
                key={row.school.rosterId}
                ref={virtual.measure}
                data-index={item.index}
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
            );
          })}
          <Spacer height={virtual.padBottom} />
        </div>
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
  const coach = coachLabel(selection);
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
