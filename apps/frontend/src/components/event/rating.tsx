import { StarIcon } from "@phosphor-icons/react";
import * as React from "react";

import {
  Rating as UiRating,
  RatingItem as UiRatingItem,
} from "@/components/ui/rating";
import { cn } from "@/components/utils/cn";

/** An unset star: an outline that reads as empty on both the dark and the light ground. */
const emptyStar = "text-fg-disabled";

type RatingProps = Omit<
  React.ComponentProps<typeof UiRating>,
  | "value"
  | "defaultValue"
  | "onValueChange"
  | "max"
  | "step"
  | "clearable"
  | "size"
  | "asChild"
  | "children"
> & {
  /** The current score, 0 (unrated) to `max`. */
  value: number;
  /** Called with the new score; 0 when the current score is clicked again (cleared). */
  onValueChange?: (value: number) => void;
  /** Who is rated, e.g. the dancer's name. Names the group and each star. */
  label: string;
  /** Number of stars. Default 5. */
  max?: number;
  /** Hide the mono score after the stars. Phones always hide it. */
  hideValue?: boolean;
  /** `md` (default) 14px stars, 12px on phones; `lg` 22px stars, each in a 40px tap area, for touch. */
  size?: "md" | "lg";
};

/**
 * A coach's editable score as 14px stars (12px on phones) with the number after
 * them. Set stars are gold (`--star`); hover previews the score in faded gold; clicking
 * the current score clears it.
 */
function Rating({
  value,
  onValueChange,
  label,
  max = 5,
  hideValue = false,
  size = "md",
  readOnly,
  disabled,
  onHover,
  className,
  ...props
}: RatingProps) {
  const [hovered, setHovered] = React.useState<number | null>(null);
  // Hovering the saved score shows it solid, so a click reads as set straight away.
  const previewing = hovered !== null && hovered !== value;

  return (
    <UiRating
      value={value}
      onValueChange={onValueChange}
      onHover={(next) => {
        setHovered(next);
        onHover?.(next);
      }}
      max={max}
      step={1}
      clearable
      readOnly={readOnly}
      disabled={disabled}
      aria-label={`Rating for ${label}`}
      className={cn(
        "text-fg gap-0 data-disabled:cursor-not-allowed data-disabled:opacity-35",
        className,
      )}
      {...props}
    >
      {Array.from({ length: max }, (_, index) => (
        <UiRatingItem
          key={index}
          index={index}
          aria-label={`Rate ${label} ${index + 1} of ${max}`}
          className={cn(
            "s2s-focus size-auto rounded-(--radius-2) px-[2px] py-[7px] focus-visible:ring-0 disabled:opacity-100",
            // components/ui/rating's focus:outline-none otherwise hides the s2s-focus ring.
            "focus-visible:outline-solid",
            // components/ui/rating clears an empty item's svg fill; a Phosphor outline star is a filled path.
            "data-[state=empty]:[&_svg]:fill-current",
            size === "lg"
              ? "flex size-10 items-center justify-center p-0"
              : "bp-phone:px-[1.5px] bp-phone:py-[8px]",
            readOnly ? "cursor-default" : "cursor-pointer",
          )}
        >
          {(dataState) => (
            <StarIcon
              aria-hidden="true"
              weight={dataState === "empty" ? "regular" : "fill"}
              className={cn(
                "block transition-[color] duration-100 ease-[ease]",
                size === "lg"
                  ? "size-[22px]"
                  : "bp-phone:size-[12px] size-[14px]",
                dataState === "empty"
                  ? emptyStar
                  : previewing
                    ? "text-star/55"
                    : "text-star",
              )}
            />
          )}
        </UiRatingItem>
      ))}
      {!hideValue && (
        <span
          aria-hidden="true"
          className="type-meta text-fg-3 bp-phone:hidden ml-(--space-6) w-[10px]"
        >
          {value > 0 ? value : "–"}
        </span>
      )}
    </UiRating>
  );
}

type RatingMeterSize = "sm" | "row" | "lg";

const meterSizes: Record<RatingMeterSize, { group: string; star: string }> = {
  // Peek summaries: 10px stars.
  sm: { group: "gap-px", star: "size-[10px]" },
  // List rows: the same stars and spacing as the editable Rating (14px, 12px on phones).
  row: {
    group: "gap-[4px] bp-phone:gap-[3px]",
    star: "size-[14px] bp-phone:size-[12px]",
  },
  // The top-ranked headline: 14px at every width.
  lg: { group: "gap-(--space-2)", star: "size-[14px]" },
};

type RatingMeterProps = Omit<React.ComponentProps<"span">, "children"> & {
  /** The score, 0 (unrated) to `max`. */
  value: number;
  /** Number of stars. Default 5. */
  max?: number;
  /** `sm` (default) 10px stars for peeks, `row` to match `Rating` in a list row, `lg` 14px for the top-ranked headline. */
  size?: RatingMeterSize;
};

/** The read-only score as stars, for peeks, summaries and rows the coach can't edit in place. */
function RatingMeter({
  value,
  max = 5,
  size = "sm",
  className,
  ...props
}: RatingMeterProps) {
  const { group, star } = meterSizes[size];
  return (
    <span
      role="img"
      aria-label={value > 0 ? `Rated ${value} of ${max}` : "Not rated"}
      className={cn("inline-flex flex-none items-center", group, className)}
      {...props}
    >
      {Array.from({ length: max }, (_, index) => {
        const filled = index < value;
        return (
          <StarIcon
            key={index}
            aria-hidden="true"
            // A regular outline is too thin to read at 10px.
            weight={filled ? "fill" : size === "sm" ? "bold" : "regular"}
            className={cn("block", star, filled ? "text-star" : emptyStar)}
          />
        );
      })}
    </span>
  );
}

export { Rating, RatingMeter };
export type { RatingMeterProps, RatingMeterSize, RatingProps };
