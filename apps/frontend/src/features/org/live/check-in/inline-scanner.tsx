import {
  ArrowCounterClockwiseIcon,
  CameraIcon,
  CameraRotateIcon,
  ImageIcon,
  StopIcon,
} from "@phosphor-icons/react";
import * as React from "react";

import { Button } from "@/components/event/button";
import { Icon } from "@/components/event/icon";
import {
  Viewfinder,
  type ViewfinderResult,
  type ViewfinderSize,
} from "@/components/event/viewfinder";
import { useCallbackRef } from "@/components/hooks/use-callback-ref";
import { cn } from "@/components/utils/cn";
import {
  type ScanCheckInResponse,
  useAdminCheckInToggle,
  useScanCheckIn,
} from "@/features/org/api/check-in-queries";
import {
  formatCheckInTime,
  looksLikeCheckInCode,
  scanFailure,
  type ScanFailure,
} from "@/features/org/live/check-in/check-in-code";
import { useEventTimeZone } from "@/features/org/live/shared/use-event-time-zone";
import {
  decodeImage,
  type QrScannerStatus,
  useQrScanner,
} from "@/features/org/live/check-in/use-qr-scanner";

export type ScannedDancer = ScanCheckInResponse["roster"];

/** A "Take photo" image that couldn't be scanned. */
type PhotoFailure = "no-pass-in-photo" | "unreadable-photo";

/** What one scan came to. */
export type ScanOutcome =
  | { kind: "checked-in" | "already" | "undone"; roster: ScannedDancer }
  | { kind: ScanFailure | PhotoFailure };

type InlineScannerProps = {
  slug: string;
  eventId: string;
  /**
   * Camera on while true: it starts without a click and stops the moment this
   * turns false. The Stop button turns it off until Scan, or until `active`
   * next turns true.
   */
  active: boolean;
  /** `md` the 280px widget scanner (180px on phones), `lg` the 400px check-in desk scanner. */
  size?: ViewfinderSize;
  /** Called for every result, e.g. to update a "Last checked in" card or flash a list row. */
  onResult?: (outcome: ScanOutcome) => void;
  /**
   * Fill the parent's height and shrink the viewfinder to the space left after
   * the buttons, so they never get pushed out of a fixed-height panel.
   */
  fillHeight?: boolean;
  /** Extra classes for the viewfinder, e.g. a size cap from the parent's container. */
  viewfinderClassName?: string;
  /** True while a scan is in flight or a result is over the feed. */
  onBusyChange?: (busy: boolean) => void;
  className?: string;
};

/** How long a result stays over the feed before scanning carries on by itself. */
const RESULT_MS = 2500;

const idleCopy: Record<
  Exclude<QrScannerStatus, "starting" | "scanning">,
  { title: string; hint: string; retry: boolean }
> = {
  stopped: {
    title: "Ready to scan",
    hint: "Hold the dancer's pass inside the frame",
    retry: false,
  },
  paused: {
    title: "Camera paused",
    hint: "It turns back on when you return to this tab.",
    retry: false,
  },
  denied: {
    title: "Camera blocked",
    hint: "Allow the camera for this site in your browser's address bar or site settings, or use Take photo.",
    retry: true,
  },
  "no-camera": {
    title: "No camera found",
    hint: "Use Take photo to scan a pass.",
    retry: true,
  },
  insecure: {
    title: "Camera unavailable",
    hint: "The live camera needs HTTPS. Use Take photo to scan a pass.",
    retry: false,
  },
  error: {
    title: "Camera unavailable",
    hint: "The live camera isn't available here. Use Take photo to scan a pass.",
    retry: true,
  },
};

const failureCopy: Record<
  ScanFailure | PhotoFailure,
  { title: string; detail?: string }
> = {
  "no-pass-in-photo": {
    title: "No pass found in the photo",
    detail: "Try again with the code filling more of the frame",
  },
  "unreadable-photo": {
    title: "Couldn't read that photo",
    detail: "Try again",
  },
  unrecognized: {
    title: "Pass not recognized",
    detail: "Find the dancer in the list instead",
  },
  "wrong-event": { title: "This pass is for a different event" },
  "not-on-roster": {
    title: "Not on the roster",
    detail: "Find the dancer in the list instead",
  },
  failed: {
    title: "Couldn't check in",
    detail: "Check the connection and scan again",
  },
};

function dancerName(roster: { firstName: string; lastName: string }) {
  return `${roster.firstName} ${roster.lastName}`.trim();
}

/**
 * The check-in scanner: the camera starts as soon as it is active, each pass it
 * reads checks the dancer in, and the result clears itself so the next dancer
 * can step up without anyone clicking.
 */
export function InlineScanner({
  slug,
  eventId,
  active,
  size = "md",
  onResult,
  onBusyChange,
  fillHeight = false,
  viewfinderClassName,
  className,
}: InlineScannerProps) {
  const scan = useScanCheckIn(slug, eventId);
  const toggle = useAdminCheckInToggle();
  const timeZone = useEventTimeZone();
  const [hit, setHit] = React.useState<{ id: number; outcome: ScanOutcome }>();
  const [holding, setHolding] = React.useState(false);
  const [reading, setReading] = React.useState(false);
  const photoInput = React.useRef<HTMLInputElement>(null);

  // Stop holds the camera off until Scan; closing and reopening (active
  // false, then true) starts it on its own again.
  const [stopped, setStopped] = React.useState(false);
  const [wasActive, setWasActive] = React.useState(active);
  if (active !== wasActive) {
    setWasActive(active);
    if (active) setStopped(false);
  }

  const show = React.useCallback(
    (outcome: ScanOutcome) => {
      setHit((prev) => ({ id: (prev?.id ?? 0) + 1, outcome }));
      onResult?.(outcome);
    },
    [onResult],
  );

  const submit = (text: string) => {
    if (!looksLikeCheckInCode(text)) {
      show({ kind: "unrecognized" });
      return;
    }
    scan.mutate(text.trim(), {
      onSuccess: ({ result, roster }) => {
        // Chrome refuses (and logs) vibrate before any tap on the page.
        if (
          result === "checked_in" &&
          (navigator.userActivation?.hasBeenActive ?? true)
        )
          navigator.vibrate?.(40);
        show({
          kind: result === "checked_in" ? "checked-in" : "already",
          roster,
        });
      },
      onError: (error) => show({ kind: scanFailure(error) }),
    });
  };

  const handleCode = (text: string) => {
    if (scan.isPending || hit || reading) return;
    submit(text);
  };

  const handlePhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file || scan.isPending) return;
    setHit(undefined);
    setReading(true);
    let text: string | undefined;
    try {
      text = await decodeImage(file);
    } catch {
      setReading(false);
      show({ kind: "unreadable-photo" });
      return;
    }
    setReading(false);
    if (text) submit(text);
    else show({ kind: "no-pass-in-photo" });
  };

  const { videoRef, status, canSwitchCamera, mirrored, switchCamera, retry } =
    useQrScanner({
      active: active && !stopped,
      paused: scan.isPending || hit !== undefined || reading,
      onCode: handleCode,
    });

  const busy = scan.isPending || hit !== undefined || reading;
  const reportBusy = useCallbackRef(onBusyChange);
  React.useEffect(() => {
    reportBusy(busy);
  }, [busy, reportBusy]);

  // The result clears itself; only a pointer or focus on Undo holds it.
  React.useEffect(() => {
    if (!hit || holding) return;
    const timer = window.setTimeout(() => setHit(undefined), RESULT_MS);
    return () => window.clearTimeout(timer);
  }, [hit, holding]);

  const undo = (roster: ScannedDancer) => {
    setHolding(false);
    toggle.mutate(
      { slug, eventId, rosterId: roster.id, currentlyCheckedIn: true },
      {
        onSuccess: () => show({ kind: "undone", roster }),
        onError: () => show({ kind: "failed" }),
      },
    );
  };

  const result = hit
    ? toViewfinderResult(hit, undo, setHolding, toggle.isPending, timeZone)
    : undefined;
  const cameraOn = status === "starting" || status === "scanning";
  const live = cameraOn || reading;
  const idle = live ? undefined : idleCopy[status];
  const control = size === "lg" ? "md" : "sm";

  return (
    <div
      className={cn(
        "bp-phone:gap-(--space-8) flex w-full flex-col items-center gap-(--space-12)",
        fillHeight && "min-h-0 flex-1",
        className,
      )}
    >
      <div
        className={cn(
          "flex w-full justify-center",
          // A size container, so the viewfinder can cap its width at the
          // height left over (100cqh) and stay square.
          fillHeight && "@container-[size] min-h-0 flex-1 items-center",
        )}
      >
        <Viewfinder
          size={size}
          className={cn(
            fillHeight && "max-w-[min(400px,100cqh)]",
            viewfinderClassName,
          )}
          state={result ? "hit" : live ? "live" : "idle"}
          result={result}
          feedVisible={
            cameraOn || (result !== undefined && status !== "stopped")
          }
          caption={
            reading
              ? "Reading photo"
              : status === "starting"
                ? "Starting camera"
                : scan.isPending
                  ? "Checking"
                  : "Scanning"
          }
          idleTitle={idle?.title}
          idleHint={
            idle && <span className="type-caption block">{idle.hint}</span>
          }
          action={
            idle?.retry && (
              <Button size="lg" onClick={retry}>
                Try again
              </Button>
            )
          }
        >
          <video
            ref={videoRef}
            muted
            playsInline
            autoPlay
            disablePictureInPicture
            webkit-playsinline="true"
            data-testid="check-in-camera"
            className={cn("size-full object-cover", mirrored && "-scale-x-100")}
          />
        </Viewfinder>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-(--space-8)">
        {status === "stopped" ? (
          <Button
            variant="primary"
            size={control}
            onClick={() => setStopped(false)}
          >
            <Icon icon={CameraIcon} />
            Scan
          </Button>
        ) : null}
        {cameraOn || status === "paused" ? (
          <Button
            variant="ghost"
            size={control}
            onClick={() => setStopped(true)}
          >
            <Icon icon={StopIcon} />
            Stop
          </Button>
        ) : null}
        <Button
          size={control}
          disabled={reading || scan.isPending}
          onClick={() => photoInput.current?.click()}
        >
          <Icon icon={ImageIcon} />
          Take photo
        </Button>
        <input
          ref={photoInput}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          tabIndex={-1}
          aria-hidden="true"
          data-testid="check-in-photo"
          onChange={handlePhoto}
        />
        {canSwitchCamera && (
          <Button
            variant="ghost"
            size={control}
            onClick={switchCamera}
            title="Switch camera"
          >
            <Icon icon={CameraRotateIcon} />
            Switch camera
          </Button>
        )}
      </div>
    </div>
  );
}

function toViewfinderResult(
  hit: { id: number; outcome: ScanOutcome },
  undo: (roster: ScannedDancer) => void,
  setHolding: (holding: boolean) => void,
  undoing: boolean,
  timeZone: string | null,
): ViewfinderResult {
  const { outcome } = hit;
  if (
    outcome.kind === "checked-in" ||
    outcome.kind === "already" ||
    outcome.kind === "undone"
  ) {
    const { roster } = outcome;
    const time = roster.checkedInAt
      ? formatCheckInTime(roster.checkedInAt, timeZone)
      : "";
    const hold = {
      onPointerEnter: () => setHolding(true),
      onPointerLeave: () => setHolding(false),
      onFocus: () => setHolding(true),
      onBlur: () => setHolding(false),
    };
    return {
      id: hit.id,
      variant: outcome.kind === "checked-in" ? "success" : "again",
      bib: roster.bib ?? "[No bib]",
      title: dancerName(roster),
      detail:
        outcome.kind === "checked-in"
          ? `Checked in · ${time}`
          : outcome.kind === "already"
            ? `Already checked in at ${time}`
            : "Check-in undone",
      action: outcome.kind === "checked-in" && (
        <Button
          size="sm"
          disabled={undoing}
          onClick={() => undo(roster)}
          {...hold}
        >
          <Icon icon={ArrowCounterClockwiseIcon} />
          Undo
        </Button>
      ),
    };
  }
  const copy = failureCopy[outcome.kind];
  return {
    id: hit.id,
    variant: "miss",
    title: copy.title,
    detail: copy.detail,
  };
}
