import { QRCodeSVG } from "qrcode.react";
import type * as React from "react";

import { cn } from "@/components/utils/cn";

type QrCodeProps = Omit<
  React.ComponentProps<typeof QRCodeSVG>,
  "value" | "size" | "fgColor" | "bgColor" | "title"
> & {
  /** The text the code encodes. */
  value: string;
  /** Rendered size in px (the SVG also scales with CSS, e.g. `size-full`). Default 128. */
  size?: number;
  /** Accessible name, e.g. "Check-in code for bib 230". */
  label: string;
};

/**
 * A QR code drawn as SVG. Modules take the text colour (`currentColor`) on a
 * transparent ground, so set the colours with `text-*` and the parent's `bg-*`.
 */
function QrCode({
  value,
  size = 128,
  label,
  level = "M",
  marginSize = 0,
  className,
  ...props
}: QrCodeProps) {
  return (
    <QRCodeSVG
      value={value}
      size={size}
      level={level}
      marginSize={marginSize}
      fgColor="currentColor"
      bgColor="transparent"
      title={label}
      aria-label={label}
      className={cn("block shrink-0", className)}
      {...props}
    />
  );
}

export { QrCode };
export type { QrCodeProps };
