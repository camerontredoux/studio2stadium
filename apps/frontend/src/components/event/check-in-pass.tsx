import { CheckIcon } from "@phosphor-icons/react";
import type * as React from "react";

import { Icon } from "@/components/event/icon";
import { QrCode } from "@/components/event/qr-code";
import { cn } from "@/components/utils/cn";

type CheckInPassProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** The dancer's bib number. */
  bib: React.ReactNode;
  /** The dancer's name. */
  name: React.ReactNode;
  /** Whether the dancer is checked in; sets the status colour and check. */
  checkedIn: boolean;
  /** Status text, e.g. "Checked in · 10:12". Default "Checked in" or "Not checked in". */
  status?: React.ReactNode;
  /** The value the QR code encodes. Ignored when `children` is given. */
  qrValue?: string;
  /** Accessible name of the code. Default "Check-in code". */
  qrLabel?: string;
  /** A custom code to draw on the card instead of `qrValue`. */
  children?: React.ReactNode;
};

/** A dancer's own check-in pass: bib, name, QR code and check-in status. */
function CheckInPass({
  bib,
  name,
  checkedIn,
  status,
  qrValue,
  qrLabel = "Check-in code",
  children,
  className,
  ...props
}: CheckInPassProps) {
  const code =
    children ??
    (qrValue ? (
      <QrCode value={qrValue} label={qrLabel} className="size-full" />
    ) : null);

  return (
    <div
      data-checked-in={checkedIn ? "" : undefined}
      className={cn(
        "flex flex-col items-center gap-(--space-14) px-(--space-16) py-(--space-24)",
        className,
      )}
      {...props}
    >
      <span className="type-bib-hero text-fg">{bib}</span>
      <span className="type-title text-fg">{name}</span>
      <div className="bg-fg text-on-fg size-[153px] shrink-0 rounded-(--radius-10) p-(--space-12)">
        {code}
      </div>
      <span
        className={cn(
          "type-data-sm inline-flex items-center gap-(--space-6)",
          checkedIn ? "text-fg" : "text-fg-3",
        )}
      >
        {checkedIn && <Icon icon={CheckIcon} />}
        {status ?? (checkedIn ? "Checked in" : "Not checked in")}
      </span>
    </div>
  );
}

export { CheckInPass };
export type { CheckInPassProps };
