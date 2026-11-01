import { WifiHighIcon, WifiSlashIcon } from "@phosphor-icons/react";

import { Icon } from "@/components/event/icon";
import { cn } from "@/components/utils/cn";
import {
  type TransmitStatus,
  useTransmitStatus,
} from "@/features/org/hooks/use-transmit";

const STATES: Record<
  TransmitStatus,
  { label: string; className: string; offline: boolean }
> = {
  connected: {
    label: "Live: connected",
    className: "text-event-accent",
    offline: false,
  },
  connecting: {
    label: "Live: connecting",
    className: "text-fg-3",
    offline: false,
  },
  reconnecting: {
    label: "Live: connecting",
    className: "text-fg-3",
    offline: false,
  },
  disconnected: {
    label: "Live: offline",
    className: "text-danger",
    offline: true,
  },
};

/**
 * The callbacks realtime connection, as the mockup draws it: a 14px wifi mark in
 * accent (connected), fg-3 (connecting) or danger with a slash (offline).
 */
function CallbacksStatusDot({ className }: { className?: string }) {
  const status = useTransmitStatus();
  const state = STATES[status];

  return (
    <span
      role="img"
      aria-label={state.label}
      title={state.label}
      className={cn(
        "inline-grid shrink-0 place-items-center",
        state.className,
        className,
      )}
    >
      <Icon icon={state.offline ? WifiSlashIcon : WifiHighIcon} />
    </span>
  );
}

export { CallbacksStatusDot };
