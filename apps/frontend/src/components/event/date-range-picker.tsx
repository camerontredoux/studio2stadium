import type { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import {
  ArrowRightIcon,
  CaretDownIcon,
  CaretLeftIcon,
  CaretRightIcon,
} from "@phosphor-icons/react";
import {
  format,
  isBefore,
  isSameMonth,
  startOfDay,
  startOfMonth,
} from "date-fns";
import * as React from "react";
import { getDefaultClassNames, type ChevronProps } from "react-day-picker";

import { Icon } from "@/components/event/icon";
import {
  RangeChip,
  RangeIndicator,
  RangePopup,
  type RangePhase,
} from "@/components/event/range-popover";
import { useConfirmTimer } from "@/components/event/use-confirm-timer";
import { buttonVariants } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover } from "@/components/ui/popover";
import { cn } from "@/components/utils/cn";

/** A start and end date; either may be unset. */
type DateRange = { start: Date | null; end: Date | null };

type DateRangePickerProps = Omit<
  React.ComponentProps<"div">,
  "onChange" | "children" | "defaultValue"
> & {
  value: DateRange;
  onChange: (next: DateRange) => void;
  /** Disables both chips. */
  disabled?: boolean;
  /** Accessible name of the start chip. Default "Start date". */
  startLabel?: string;
  /** Accessible name of the end chip. Default "End date". */
  endLabel?: string;
  /** Chip text while the start is unset. Default "Start date". */
  startPlaceholder?: string;
  /** Chip text while the end is unset. Default "End date". */
  endPlaceholder?: string;
  /** Days before this one can't be picked. */
  minDate?: Date;
};

const navButtonClass = cn(
  buttonVariants({ variant: "ghost" }),
  "size-6 rounded-(--radius-6) p-0 text-fg-2 transition-[background-color,color] duration-150 before:hidden select-none hover:bg-surface-active hover:text-fg focus-visible:ring-0 focus-visible:ring-offset-0 s2s-focus aria-disabled:opacity-35 pointer-coarse:after:min-h-auto pointer-coarse:after:min-w-auto",
);

// The range reads as one shape: the start and end days are `fg` squares, and a `range-band` fill
// runs between them, through the 2px gaps and under the inner halves of the end days.
const RANGE_BAND = "before:absolute before:inset-y-0 before:bg-range-band";

const dayButtonClass = cn(
  "relative z-[1] aspect-auto h-7 w-full min-w-0 rounded-(--radius-5) border-0 bg-transparent p-0 font-sans text-[12px] leading-none font-normal text-fg-2 tabular-nums before:hidden hover:bg-surface-active hover:text-fg sm:h-7 sm:w-full sm:text-[12px] dark:hover:text-fg",
  "transition-[background-color,color] duration-150 ease-(--ease) motion-reduce:transition-none",
  "pointer-coarse:after:min-h-auto pointer-coarse:after:min-w-auto",
  "group-data-[focused=true]/day:border-transparent group-data-[focused=true]/day:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 s2s-focus",
  "data-[selected-single=true]:bg-fg data-[selected-single=true]:font-semibold data-[selected-single=true]:text-on-fg",
  "data-[range-start=true]:rounded-(--radius-5) data-[range-start=true]:bg-fg data-[range-start=true]:font-semibold data-[range-start=true]:text-on-fg",
  "data-[range-end=true]:rounded-(--radius-5) data-[range-end=true]:bg-fg data-[range-end=true]:font-semibold data-[range-end=true]:text-on-fg",
  "data-[range-middle=true]:rounded-(--radius-5) data-[range-middle=true]:bg-transparent data-[range-middle=true]:text-fg data-[range-middle=true]:hover:bg-surface-active",
  // Days before `minDate`: faded by the cell's `opacity-35`, and inert to hover.
  "disabled:cursor-default disabled:hover:bg-transparent disabled:hover:text-fg-2",
);

function CalendarChevron({ orientation, className }: ChevronProps) {
  const glyph =
    orientation === "left"
      ? CaretLeftIcon
      : orientation === "right"
        ? CaretRightIcon
        : CaretDownIcon;
  return <Icon icon={glyph} className={cn("size-3.5", className)} />;
}

const calendarComponents = { Chevron: CalendarChevron };

const defaultClassNames = getDefaultClassNames();

// Built once: a new classNames object each render would re-render every day.
const calendarClassNames = {
  root: cn("w-full", defaultClassNames.root),
  months: cn("relative flex flex-col", defaultClassNames.months),
  month: cn("flex w-full flex-col gap-(--space-6)", defaultClassNames.month),
  nav: cn(
    "absolute inset-x-0 top-0 z-[2] flex items-center justify-between",
    defaultClassNames.nav,
  ),
  button_previous: cn(navButtonClass, defaultClassNames.button_previous),
  button_next: cn(navButtonClass, defaultClassNames.button_next),
  month_caption: cn(
    "flex h-6 w-full items-center justify-center px-6",
    defaultClassNames.month_caption,
  ),
  caption_label: cn(
    "text-[12.5px] leading-[1.4] font-medium text-fg select-none",
    defaultClassNames.caption_label,
  ),
  month_grid: cn("w-full border-collapse", defaultClassNames.month_grid),
  weekdays: cn("flex gap-(--space-2)", defaultClassNames.weekdays),
  weekday: cn(
    "h-5 flex-1 text-center font-mono text-[10.5px] leading-5 font-normal text-fg-3 select-none",
    defaultClassNames.weekday,
  ),
  week: cn(
    "mt-(--space-2) flex w-full gap-(--space-2)",
    defaultClassNames.week,
  ),
  day: cn(
    "group/day relative h-7 flex-1 p-0 text-center select-none",
    defaultClassNames.day,
  ),
  day_button: cn(dayButtonClass, defaultClassNames.day_button),
  range_start: cn(
    RANGE_BAND,
    "before:start-1/2 before:-end-px [&.rdp-range_end]:before:hidden",
    defaultClassNames.range_start,
  ),
  range_middle: cn(
    RANGE_BAND,
    "before:-inset-x-px",
    defaultClassNames.range_middle,
  ),
  range_end: cn(
    RANGE_BAND,
    "before:-start-px before:end-1/2 [&.rdp-range_start]:before:hidden",
    defaultClassNames.range_end,
  ),
  today: defaultClassNames.today,
  outside: defaultClassNames.outside,
  disabled: cn("opacity-35", defaultClassNames.disabled),
  hidden: cn("invisible", defaultClassNames.hidden),
};

const calendarFormatters = {
  formatWeekdayName: (date: Date) => format(date, "EEEEE"),
};

function chipText(date: Date | null, placeholder: string) {
  return date ? format(date, "EEE, MMM d") : placeholder;
}

/** The date a phase is about: the end (or start) while picking the end, else the start. */
function focusDate(phase: RangePhase, value: DateRange) {
  return phase === "end" ? (value.end ?? value.start) : value.start;
}

/**
 * Start and end date chips that open one calendar. Picking a start moves on to the end; picking
 * the end closes the calendar. The calendar stays open while you move between the chips, and the
 * highlight slides to the chip being picked.
 *
 * - Picking a start on or before the current end keeps the end; a start after it clears the end.
 * - While picking the end, a day before the start becomes the new start.
 * - While picking the end, hovering or focusing a day previews the range.
 */
/** The date, or null when it is missing or invalid. */
function validDate(date: Date | null | undefined): Date | null {
  return date instanceof Date && !Number.isNaN(date.getTime()) ? date : null;
}

function DateRangePicker({
  value: rawValue,
  onChange,
  disabled = false,
  startLabel = "Start date",
  endLabel = "End date",
  startPlaceholder = "Start date",
  endPlaceholder = "End date",
  minDate,
  className,
  ...props
}: DateRangePickerProps) {
  const id = React.useId();
  const startId = `${id}-start`;
  const endId = `${id}-end`;
  const fieldRef = React.useRef<HTMLDivElement>(null);
  const startRef = React.useRef<HTMLButtonElement>(null);
  const endRef = React.useRef<HTMLButtonElement>(null);
  const popupRef = React.useRef<HTMLDivElement>(null);
  // Callers may pass undefined or an invalid date mid-edit; everything below sees a Date or null.
  const rawStart = validDate(rawValue?.start);
  const rawEnd = validDate(rawValue?.end);
  const value = React.useMemo<DateRange>(
    () => ({ start: rawStart, end: rawEnd }),
    [rawStart, rawEnd],
  );
  const [phase, setPhase] = React.useState<RangePhase | null>(null);
  const [month, setMonth] = React.useState<Date>(() =>
    startOfMonth(value.start ?? minDate ?? new Date()),
  );
  const [preview, setPreview] = React.useState<Date | null>(null);
  const confirm = useConfirmTimer();

  // Show the month of the date being picked, unless it is already on screen.
  const goTo = (next: RangePhase | null, range: DateRange = value) => {
    setPhase(next);
    setPreview(null);
    if (!next) return;
    const target = focusDate(next, range);
    if (target && !isSameMonth(target, month)) setMonth(startOfMonth(target));
  };

  const handleOpenChange = (
    open: boolean,
    details: PopoverPrimitive.Root.ChangeEventDetails,
  ) => {
    confirm.clear();
    goTo(open ? (details.trigger?.id === endId ? "end" : "start") : null);
  };

  const pick = (day: Date) => {
    // The calendar never offers a day before `minDate`; this guards anything else that calls in.
    if (minDate && isBefore(startOfDay(day), startOfDay(minDate))) return;
    confirm.clear();
    if (phase === "end" && value.start && !isBefore(day, value.start)) {
      onChange({ start: value.start, end: day });
      // Leave the finished range on screen for a moment, then close.
      confirm.after(() => goTo(null));
      return;
    }
    const end = value.end && !isBefore(value.end, day) ? value.end : null;
    const next = { start: day, end };
    onChange(next);
    setPreview(null);
    if (phase !== "end") confirm.after(() => goTo("end", next));
  };

  const previewing =
    phase === "end" &&
    value.start !== null &&
    preview !== null &&
    !isBefore(preview, value.start);
  const shownEnd = previewing ? preview : value.end;
  const selected = React.useMemo(
    () =>
      value.start
        ? { from: value.start, to: shownEnd ?? undefined }
        : undefined,
    [value.start, shownEnd],
  );
  const disabledDays = React.useMemo(
    () => (minDate ? { before: minDate } : undefined),
    [minDate],
  );
  // No paging back past `minDate`'s month (every day there is disabled), unless a saved start
  // is earlier still and has to stay reachable.
  const startMonth = React.useMemo(() => {
    if (!minDate) return undefined;
    const earliest =
      value.start && isBefore(value.start, minDate) ? value.start : minDate;
    return startOfMonth(earliest);
  }, [minDate, value.start]);
  // Only the end needs a preview; skip re-renders for repeat or start-phase hovers.
  const showPreview = (day: Date) => {
    if (phase !== "end") return;
    setPreview((prev) =>
      prev && prev.getTime() === day.getTime() ? prev : day,
    );
  };

  // Keyboard opens move focus to the day being picked; pointer opens leave it on the chip,
  // so no focus ring appears on the calendar.
  const initialFocus = (openType: string) => {
    if (openType !== "keyboard") return false;
    const popup = popupRef.current;
    return (
      popup?.querySelector<HTMLElement>(
        phase === "end"
          ? "[data-range-end=true], [data-selected-single=true]"
          : "[data-range-start=true], [data-selected-single=true]",
      ) ??
      // react-day-picker gives one day button tabindex 0 (selected, else today, else the
      // first enabled day). `data-day` alone also matches the hidden <td> cells.
      popup?.querySelector<HTMLElement>('button[data-day][tabindex="0"]') ??
      popup?.querySelector<HTMLElement>("button[data-day]:not([disabled])") ??
      true
    );
  };

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
            value.start
              ? `${startLabel}: ${format(value.start, "EEEE, MMMM d, yyyy")}`
              : startLabel
          }
          active={phase === "start"}
          className="font-sans"
        >
          <span className={cn("truncate", !value.start && "text-fg-3")}>
            {chipText(value.start, startPlaceholder)}
          </span>
        </RangeChip>
        <Icon icon={ArrowRightIcon} className="text-fg-3" />
        <RangeChip
          id={endId}
          ref={endRef}
          disabled={disabled}
          aria-label={
            value.end
              ? `${endLabel}: ${format(value.end, "EEEE, MMMM d, yyyy")}`
              : endLabel
          }
          active={phase === "end"}
          className="font-sans"
        >
          <span className={cn("truncate", !value.end && "text-fg-3")}>
            {chipText(value.end, endPlaceholder)}
          </span>
        </RangeChip>
        <RangeIndicator phase={phase} startRef={startRef} endRef={endRef} />
        <RangePopup
          ref={popupRef}
          anchor={fieldRef}
          aria-label={phase === "end" ? "Choose end date" : "Choose start date"}
          initialFocus={initialFocus}
          className="p-(--space-8)"
        >
          <div onMouseLeave={() => setPreview(null)}>
            <Calendar
              mode="range"
              showOutsideDays={false}
              selected={selected}
              onSelect={(_range, day) => pick(day)}
              onDayMouseEnter={showPreview}
              onDayFocus={showPreview}
              disabled={disabledDays}
              startMonth={startMonth}
              month={month}
              onMonthChange={setMonth}
              formatters={calendarFormatters}
              components={calendarComponents}
              className="w-full bg-transparent p-0 [--cell-size:24px]"
              classNames={calendarClassNames}
            />
          </div>
        </RangePopup>
      </Popover>
    </div>
  );
}

export { DateRangePicker };
export type { DateRange, DateRangePickerProps };
