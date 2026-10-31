import {
  CheckCircleIcon,
  QrCodeIcon,
  XCircleIcon,
} from "@phosphor-icons/react";
import type * as React from "react";

import { Icon } from "@/components/event/icon";
import { cn } from "@/components/utils/cn";

type ViewfinderState = "idle" | "live" | "hit" | "done";
type ViewfinderSize = "md" | "lg";
type ViewfinderResultVariant = "success" | "again" | "miss";

type ViewfinderResult = {
  /** Changing it replays the overlay's entrance (e.g. a scan id). */
  id?: React.Key;
  /** `success` checked in now, `again` already checked in, `miss` not recognised. */
  variant: ViewfinderResultVariant;
  /** The dancer's bib; omit for a miss. */
  bib?: React.ReactNode;
  /** The dancer's name, or the miss message ("Not on the roster"). */
  title: React.ReactNode;
  /** One line under the title, e.g. "Checked in · 09:48". */
  detail?: React.ReactNode;
  /** An optional control under the result, e.g. an Undo button. */
  action?: React.ReactNode;
};

type ViewfinderProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** `idle` camera closed, `live` scanning, `hit` showing `result`, `done` everyone checked in. */
  state: ViewfinderState;
  /** The scan result shown over the feed while `state` is `hit`. */
  result?: ViewfinderResult;
  /** The mono state caption while `live`. Default "Scanning". */
  caption?: React.ReactNode;
  /** Fades the camera feed in (300ms). Default: any state but `idle`. */
  feedVisible?: boolean;
  /** Renders a muted inline `<video>` for the camera stream and attaches this ref. */
  videoRef?: React.Ref<HTMLVideoElement>;
  /** A custom camera feed, layered under the frame like the video. */
  children?: React.ReactNode;
  /** The idle control, e.g. the primary "Open camera" button. */
  action?: React.ReactNode;
  /** Idle heading (the full-page desk uses "Ready to scan"). */
  idleTitle?: React.ReactNode;
  /** Idle hint under the heading. */
  idleHint?: React.ReactNode;
  /** Text of the `done` state. Default "Everyone is checked in". */
  doneLabel?: React.ReactNode;
  /** `md` the 280px widget scanner (180px on phones), `lg` the 400px check-in desk scanner. */
  size?: ViewfinderSize;
  /** Accessible name of the scanner region. Default "QR scanner". */
  label?: string;
};

const frame: Record<ViewfinderSize, string> = {
  md: "max-w-[280px] rounded-(--radius-12) p-(--space-24) bp-phone:max-w-[180px] bp-phone:p-(--space-16)",
  lg: "max-w-[400px] rounded-[14px] p-(--space-24)",
};

const corner: Record<ViewfinderSize, string> = {
  md: "size-[22px]",
  lg: "size-[28px]",
};

const corners: Record<ViewfinderSize, string[]> = {
  md: [
    "top-[14px] left-[14px] border-t-2 border-l-2 rounded-tl-[6px]",
    "top-[14px] right-[14px] border-t-2 border-r-2 rounded-tr-[6px]",
    "bottom-[14px] left-[14px] border-b-2 border-l-2 rounded-bl-[6px]",
    "bottom-[14px] right-[14px] border-b-2 border-r-2 rounded-br-[6px]",
  ],
  lg: [
    "top-[16px] left-[16px] border-t-2 border-l-2 rounded-tl-[8px]",
    "top-[16px] right-[16px] border-t-2 border-r-2 rounded-tr-[8px]",
    "bottom-[16px] left-[16px] border-b-2 border-l-2 rounded-bl-[8px]",
    "bottom-[16px] right-[16px] border-b-2 border-r-2 rounded-br-[8px]",
  ],
};

const captionPos: Record<ViewfinderSize, string> = {
  md: "bottom-[26px]",
  lg: "bottom-[32px]",
};

const overlay: Record<ViewfinderSize, string> = {
  md: "gap-(--space-10) p-(--space-24) bp-phone:gap-(--space-6) bp-phone:p-(--space-16)",
  lg: "gap-(--space-10) p-[32px]",
};

const stateIconSize: Record<ViewfinderSize, number> = { md: 32, lg: 40 };

const resultText: Record<
  ViewfinderSize,
  { bib: string; title: string; detail: string }
> = {
  md: {
    bib: "type-bib-lg",
    title: "type-title-sm",
    detail: "type-meta",
  },
  lg: {
    bib: "font-mono text-[44px] leading-none font-medium tabular-nums",
    title: "font-sans text-[18px] leading-[1.4] font-semibold",
    detail: "type-data-sm",
  },
};

const variantIcon: Record<
  ViewfinderResultVariant,
  { icon: typeof CheckCircleIcon; className: string }
> = {
  success: { icon: CheckCircleIcon, className: "text-fg" },
  again: { icon: CheckCircleIcon, className: "text-fg-3" },
  miss: { icon: XCircleIcon, className: "text-danger" },
};

const overlayBase =
  "absolute inset-0 z-3 flex rounded-[inherit] flex-col items-center justify-center bg-veil text-center backdrop-blur-[8px] " +
  "animate-in fade-in zoom-in-98 duration-250 ease-[ease]";

/**
 * The square check-in QR scanner frame: corner brackets, the camera feed slot and the result overlay. Visual only; the consumer owns the
 * camera stream and the decoding.
 */
function Viewfinder({
  state,
  result,
  caption = "Scanning",
  feedVisible,
  videoRef,
  children,
  action,
  idleTitle,
  idleHint,
  doneLabel = "Everyone is checked in",
  size = "md",
  label = "QR scanner",
  className,
  ...props
}: ViewfinderProps) {
  const showFeed = feedVisible ?? state !== "idle";
  const active = state !== "idle";
  const hasFeed = videoRef !== undefined || children !== undefined;
  const iconPx = stateIconSize[size];
  const text = resultText[size];

  return (
    <div
      role="region"
      aria-label={label}
      aria-live="polite"
      data-state={state}
      className={cn(
        "border-line relative isolate flex aspect-square w-full shrink-0 flex-col items-center justify-center overflow-hidden border text-center",
        // The camera (live, hit) stays dark in the light theme too. Idle and
        // done have no camera behind them, so they follow the theme.
        !active
          ? "bg-bg-100"
          : state === "done"
            ? "bg-bg-000 [html:not(.dark)_&]:bg-bg-100"
            : "s2s-keep-dark bg-bg-000",
        frame[size],
        className,
      )}
      {...props}
    >
      {hasFeed && (
        <div
          aria-hidden="true"
          className={cn(
            "absolute inset-0 rounded-[inherit] overflow-hidden opacity-0 transition-opacity duration-300 ease-[ease]",
            showFeed && "opacity-100",
          )}
        >
          {videoRef !== undefined && (
            <video
              ref={videoRef}
              muted
              playsInline
              autoPlay
              className="size-full object-cover"
            />
          )}
          {children}
        </div>
      )}

      {corners[size].map((position) => (
        <span
          key={position}
          aria-hidden="true"
          className={cn(
            "absolute z-4 border-solid transition-[border-color] duration-200 ease-[ease]",
            corner[size],
            position,
            active ? "border-fg" : "border-line-focus",
          )}
        />
      ))}

      {state === "idle" && (
        <div
          className={cn(
            "relative z-2 flex flex-col items-center",
            size === "lg"
              ? "type-body text-fg-3 gap-(--space-12) px-[32px]"
              : "gap-(--space-10)",
          )}
        >
          <Icon icon={QrCodeIcon} size={iconPx} className="text-fg-3" />
          {idleTitle && <span className="type-title text-fg">{idleTitle}</span>}
          {idleHint && <span className="text-fg-3">{idleHint}</span>}
          {action}
        </div>
      )}

      {state === "live" && (
        <>
          <span
            className={cn(
              "type-label absolute inset-x-0 z-2",
              captionPos[size],
              showFeed
                ? "text-fg [text-shadow:0_1px_2px_rgba(0,0,0,0.6)]"
                : "text-fg-2",
            )}
          >
            {caption}
          </span>
        </>
      )}

      {state === "hit" && result && (
        <div
          key={result.id ?? `${result.variant}:${String(result.bib ?? "")}`}
          data-variant={result.variant}
          className={cn(overlayBase, overlay[size])}
        >
          <Icon
            icon={variantIcon[result.variant].icon}
            size={iconPx}
            className={variantIcon[result.variant].className}
          />
          {result.bib !== undefined && result.bib !== null && (
            <span className={cn("text-fg", text.bib)}>{result.bib}</span>
          )}
          <span
            className={cn(
              text.title,
              result.variant === "miss" ? "text-danger" : "text-fg",
            )}
          >
            {result.title}
          </span>
          {result.detail && (
            <span className={cn("text-fg-2", text.detail)}>
              {result.detail}
            </span>
          )}
          {result.action && (
            <span className="mt-(--space-6)">{result.action}</span>
          )}
        </div>
      )}

      {state === "done" && (
        <div className={cn(overlayBase, overlay[size])}>
          <Icon icon={CheckCircleIcon} size={iconPx} className="text-fg" />
          <span className="type-body text-fg">{doneLabel}</span>
        </div>
      )}
    </div>
  );
}

export { Viewfinder };
export type {
  ViewfinderProps,
  ViewfinderResult,
  ViewfinderResultVariant,
  ViewfinderSize,
  ViewfinderState,
};
