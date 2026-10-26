import type { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { eachMinuteOfInterval, format } from "date-fns";
import * as React from "react";

import { Icon } from "@/components/event/icon";
import {
  RangeChip,
  RangeIndicator,
  RangePopup,
  type RangePhase,
} from "@/components/event/range-popover";
import { useConfirmTimer } from "@/components/event/use-confirm-timer";
import {
  pickerHeaderClass,
  pickerListClass,
  pickerRowClass,
  pickerSearchClass,
} from "@/components/event/picker-styles";
import { Input } from "@/components/ui/input";
import { Popover } from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/components/utils/cn";

/** A start and end time as 24-hour "HH:mm" strings; either may be unset. */
type TimeRange = { start: string | null; end: string | null };

type TimeRangePickerProps = Omit<
  React.ComponentProps<"div">,
  "onChange" | "children" | "defaultValue"
> & {
  value: TimeRange;
  onChange: (next: TimeRange) => void;
  /** Disables both chips. */
  disabled?: boolean;
  /** Accessible name of the start chip. Default "Start time". */
  startLabel?: string;
  /** Accessible name of the end chip. Default "End time". */
  endLabel?: string;
  /** Chip text while the start is unset. Default "Start". */
  startPlaceholder?: string;
  /** Chip text while the end is unset. Default "End". */
  endPlaceholder?: string;
  /** Show only the start chip; picking a time closes the popup and `end` stays null. */
  single?: boolean;
};

// 06:00 to 22:00 every 30 minutes (33 slots). The day is only a carrier for the times.
const SLOTS = eachMinuteOfInterval(
  { start: new Date(2000, 0, 1, 6), end: new Date(2000, 0, 1, 22) },
  { step: 30 },
).map((slot) => format(slot, "HH:mm"));

/** The time the list scrolls to when nothing is picked yet. */
const DEFAULT_START = "09:00";

// Rows, list, header and search field are shared with components/event/combobox.
const slotClass = cn(
  pickerRowClass,
  "font-mono text-[12px] leading-none tabular-nums sm:h-7 sm:min-w-0 sm:text-[12px]",
);

const typeInputClass = cn(
  pickerSearchClass,
  "[&_input]:font-mono [&_input]:tabular-nums",
);

/** Whether `a` is later than `b`; both are zero-padded "HH:mm". */
function isLater(a: string, b: string) {
  return a > b;
}

/** "HH:mm" from "8:30", "08:30" or "08:30:00"; null for anything else (null, undefined, ""). */
function normalizeTime(time: string | null | undefined): string | null {
  if (typeof time !== "string") return null;
  const match = /^(\d{1,2}):(\d{2})/.exec(time.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return `${String(hours).padStart(2, "0")}:${match[2]}`;
}

/** Minutes since midnight of an "HH:mm" time; 0 when it is missing or malformed. */
function toMinutes(time: string | null | undefined) {
  const hm = normalizeTime(time);
  if (!hm) return 0;
  const [h, m] = hm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function fromMinutes(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Reads a typed time as 24-hour "HH:mm": "9", "930", "0930", "9:30", "21.30" and "2130"
 * all work. Returns null when it isn't a time.
 */
function parseTime(input: string): string | null {
  const text = input.trim().replace(/[.\sh]/g, ":");
  let hours: number;
  let minutes: number;
  const withColon = /^(\d{1,2}):(\d{1,2})?$/.exec(text);
  if (withColon) {
    hours = Number(withColon[1]);
    minutes = Number(withColon[2] ?? 0);
  } else if (/^\d{1,4}$/.test(text)) {
    const split = text.length <= 2 ? text.length : text.length - 2;
    hours = Number(text.slice(0, split));
    minutes = Number(text.slice(split) || 0);
  } else {
    return null;
  }
  if (hours > 23 || minutes > 59) return null;
  return fromMinutes(hours * 60 + minutes);
}

/** The slot nearest a time, preferring enabled slots. */
function nearestSlot(
  slots: string[],
  time: string,
  isDisabled: (slot: string) => boolean,
) {
  const target = toMinutes(time);
  let best: string | undefined;
  for (const slot of slots) {
    if (isDisabled(slot)) continue;
    if (
      best === undefined ||
      Math.abs(toMinutes(slot) - target) < Math.abs(toMinutes(best) - target)
    ) {
      best = slot;
    }
  }
  return best;
}

/** "30m", "1h", "1h 30m". */
function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Start and end time chips that open one list of times, 06:00 to 22:00 every 30 minutes, in a
 * single scrolling column that reads at any width. The list scrolls to the picked (or nearest)
 * time, the arrow keys move through it, and you can type any 24-hour time above it.
 *
 * Pick the start, then an end after it, and the popup closes. `single` shows only the start.
 */
function TimeRangePicker({
  value: rawValue,
  onChange,
  disabled = false,
  startLabel = "Start time",
  endLabel = "End time",
  startPlaceholder = "Start",
  endPlaceholder = "End",
  single = false,
  className,
  ...props
}: TimeRangePickerProps) {
  const id = React.useId();
  const startId = `${id}-start`;
  const endId = `${id}-end`;
  const hintId = `${id}-hint`;
  const fieldRef = React.useRef<HTMLDivElement>(null);
  const startRef = React.useRef<HTMLButtonElement>(null);
  const endRef = React.useRef<HTMLButtonElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  // The list as state (so the scroll effect runs once it mounts) and as a ref (for focus).
  const [list, setList] = React.useState<HTMLDivElement | null>(null);
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const attachList = React.useCallback((node: HTMLDivElement | null) => {
    listRef.current = node;
    setList(node);
  }, []);
  const [phase, setPhase] = React.useState<RangePhase | null>(null);
  const [typed, setTyped] = React.useState("");
  const [typedError, setTypedError] = React.useState<string | null>(null);
  const confirm = useConfirmTimer();
  // Callers may pass "", undefined or "HH:mm:ss" mid-edit; everything below sees "HH:mm" or null.
  const value: TimeRange = {
    start: normalizeTime(rawValue?.start),
    end: normalizeTime(rawValue?.end),
  };

  // A saved time between slots (08:15) gets its own row so it shows as picked.
  const slots = React.useMemo(
    () =>
      [...new Set([...SLOTS, value.start, value.end])]
        .filter((slot): slot is string => !!slot)
        .sort(),
    [value.start, value.end],
  );

  const isDisabledSlot = (slot: string) =>
    phase === "end" && value.start !== null && !isLater(slot, value.start);

  const current = phase === "end" ? value.end : value.start;
  const typedTime = typed ? parseTime(typed) : null;
  // While typing, the nearest row is marked and scrolled to.
  const suggested = typedTime
    ? nearestSlot(slots, typedTime, isDisabledSlot)
    : undefined;
  // Where the list scrolls when it opens or moves to the end.
  const anchorSlot = (() => {
    if (current && !isDisabledSlot(current)) return current;
    if (phase === "end" && value.start) {
      return nearestSlot(
        slots,
        fromMinutes(Math.min(toMinutes(value.start) + 60, 23 * 60 + 59)),
        isDisabledSlot,
      );
    }
    return nearestSlot(slots, DEFAULT_START, isDisabledSlot);
  })();
  const scrollTarget = suggested ?? anchorSlot;

  const goTo = (next: RangePhase | null) => {
    setPhase(next);
    setTyped("");
    setTypedError(null);
  };

  const handleOpenChange = (
    open: boolean,
    details: PopoverPrimitive.Root.ChangeEventDetails,
  ) => {
    confirm.clear();
    goTo(open ? (details.trigger?.id === endId ? "end" : "start") : null);
  };

  const pick = (slot: string) => {
    confirm.clear();
    setTyped("");
    setTypedError(null);
    if (single) {
      onChange({ start: slot, end: null });
      confirm.after(() => goTo(null));
      return;
    }
    if (phase === "end" && value.start && isLater(slot, value.start)) {
      onChange({ start: value.start, end: slot });
      // Leave the finished range on screen for a moment, then close.
      confirm.after(() => goTo(null));
      return;
    }
    const end = value.end && isLater(value.end, slot) ? value.end : null;
    onChange({ start: slot, end });
    confirm.after(() => goTo("end"));
  };

  const commitTyped = () => {
    if (!typed.trim()) return;
    if (!typedTime) {
      setTypedError("Use 24-hour time, like 09:30");
      return;
    }
    if (phase === "end" && value.start && !isLater(typedTime, value.start)) {
      setTypedError(`Pick a time after ${value.start}`);
      return;
    }
    pick(typedTime);
  };

  // Scroll the list to the picked, typed or nearest time: at once when the popup opens, with
  // a short glide when it moves from start to end or follows typing. A click doesn't scroll.
  const lastScroll = React.useRef<string | null>(null);
  React.useLayoutEffect(() => {
    if (!phase) {
      lastScroll.current = null;
      return;
    }
    const key = `${phase}|${suggested ?? ""}`;
    if (!list || !scrollTarget || key === lastScroll.current) return;
    const row = list.querySelector<HTMLElement>(
      `[data-slot-time="${scrollTarget}"]`,
    );
    if (!row) return;
    const glide = lastScroll.current !== null && !prefersReducedMotion();
    lastScroll.current = key;
    list.scrollTo({
      top: row.offsetTop - (list.clientHeight - row.offsetHeight) / 2,
      behavior: glide ? "smooth" : "instant",
    });
  }, [list, phase, suggested, scrollTarget]);

  // Keyboard opens focus the row being picked; pointer opens leave focus on the chip.
  const initialFocus = (openType: string) => {
    if (openType !== "keyboard") return false;
    return (
      listRef.current?.querySelector<HTMLElement>(
        `[data-slot-time="${anchorSlot ?? ""}"]`,
      ) ?? true
    );
  };

  // Typing a digit anywhere in the list starts typing a time.
  const handleListKeyDown = (event: React.KeyboardEvent) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (!/^[\d:]$/.test(event.key)) return;
    event.preventDefault();
    setTyped(event.key);
    setTypedError(null);
    inputRef.current?.focus();
  };

  const handleInputKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commitTyped();
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      list
        ?.querySelector<HTMLElement>(`[data-slot-time="${scrollTarget ?? ""}"]`)
        ?.focus();
    }
  };

  const durationLabel = (slot: string) =>
    phase === "end" && value.start && isLater(slot, value.start)
      ? formatDuration(toMinutes(slot) - toMinutes(value.start))
      : null;

  const phaseNoun = phase === "end" ? "end" : "start";

  return (
    <div
      ref={fieldRef}
      className={cn(
        "relative flex min-w-0 items-center gap-(--space-6)",
        className,
      )}
      {...props}
    >
      <Popover
        open={phase !== null}
        triggerId={phase === "end" ? endId : phase === "start" ? startId : null}
        onOpenChange={handleOpenChange}
      >
        <RangeChip
          id={startId}
          ref={startRef}
          disabled={disabled}
          aria-label={
            value.start ? `${startLabel}: ${value.start}` : startLabel
          }
          active={phase === "start"}
          className="font-mono tabular-nums"
        >
          <span className={cn("truncate", !value.start && "text-fg-3")}>
            {value.start ?? startPlaceholder}
          </span>
        </RangeChip>
        {!single && (
          <>
            <Icon icon={ArrowRightIcon} className="text-fg-3" />
            <RangeChip
              id={endId}
              ref={endRef}
              disabled={disabled}
              aria-label={value.end ? `${endLabel}: ${value.end}` : endLabel}
              active={phase === "end"}
              className="font-mono tabular-nums"
            >
              <span className={cn("truncate", !value.end && "text-fg-3")}>
                {value.end ?? endPlaceholder}
              </span>
            </RangeChip>
          </>
        )}
        <RangeIndicator phase={phase} startRef={startRef} endRef={endRef} />
        <RangePopup
          anchor={fieldRef}
          aria-label={`Choose ${phaseNoun} time`}
          initialFocus={initialFocus}
          className="flex min-w-[132px] flex-col"
        >
          <div className={pickerHeaderClass}>
            <Input
              ref={inputRef}
              value={typed}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setTyped(event.target.value);
                setTypedError(null);
              }}
              onKeyDown={handleInputKeyDown}
              onBlur={() => setTypedError(null)}
              inputMode="numeric"
              autoComplete="off"
              placeholder="Type a time"
              aria-label={`Type ${phase === "end" ? "an end" : "a start"} time, 24-hour`}
              aria-invalid={typedError ? true : undefined}
              aria-describedby={typedError ? hintId : undefined}
              className={typeInputClass}
            />
            {typedError && (
              <p
                id={hintId}
                className="type-caption text-danger m-0 px-(--space-2) pt-(--space-4)"
              >
                {typedError}
              </p>
            )}
          </div>
          <ToggleGroup
            ref={attachList}
            orientation="vertical"
            aria-label={single ? startLabel : `${phaseNoun} time`}
            value={current ? [current] : []}
            onValueChange={(next) => {
              const slot = (next[0] as string | undefined) ?? current;
              if (slot) pick(slot);
            }}
            onKeyDown={handleListKeyDown}
            className={pickerListClass}
          >
            {slots.map((slot) => {
              const duration = durationLabel(slot);
              return (
                <ToggleGroupItem
                  key={slot}
                  value={slot}
                  data-slot-time={slot}
                  data-suggested={slot === suggested && slot !== current}
                  disabled={isDisabledSlot(slot)}
                  aria-label={duration ? `${slot}, ${duration}` : slot}
                  className={slotClass}
                >
                  <span>{slot}</span>
                  {duration && (
                    <span className="type-meta min-w-0 truncate opacity-70">
                      {duration}
                    </span>
                  )}
                </ToggleGroupItem>
              );
            })}
          </ToggleGroup>
        </RangePopup>
      </Popover>
    </div>
  );
}

export { TimeRangePicker };
export type { TimeRange, TimeRangePickerProps };
