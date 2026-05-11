import { Transmit } from "@adonisjs/transmit-client";
import { useEffect, useRef, useSyncExternalStore } from "react";

let transmit: Transmit | null = null;

function getTransmit() {
  if (!transmit) {
    transmit = new Transmit({
      baseUrl: import.meta.env.VITE_API_URL,
    });
  }
  return transmit;
}

export type TransmitStatus =
  | "connected"
  | "connecting"
  | "disconnected"
  | "reconnecting";

const RAW_EVENTS = [
  "initializing",
  "connected",
  "disconnected",
  "reconnecting",
] as const;

const STATUS_MAP: Record<(typeof RAW_EVENTS)[number], TransmitStatus> = {
  initializing: "connecting",
  connected: "connected",
  disconnected: "disconnected",
  reconnecting: "reconnecting",
};

let currentStatus: TransmitStatus = "connecting";
const statusListeners = new Set<() => void>();

function initStatusTracking() {
  const t = getTransmit();
  for (const event of RAW_EVENTS) {
    t.on(event, () => {
      currentStatus = STATUS_MAP[event];
      for (const cb of statusListeners) cb();
    });
  }
}

let statusInitialized = false;
function ensureStatusTracking() {
  if (!statusInitialized) {
    statusInitialized = true;
    initStatusTracking();
  }
}

function subscribeStatus(cb: () => void) {
  statusListeners.add(cb);
  return () => statusListeners.delete(cb);
}

function getStatusSnapshot() {
  return currentStatus;
}

export function useTransmitStatus(): TransmitStatus {
  ensureStatusTracking();
  return useSyncExternalStore(subscribeStatus, getStatusSnapshot);
}

export function useTransmitSubscription(
  channel: string | null,
  onEvent: () => void,
) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!channel) return;

    const t = getTransmit();
    const subscription = t.subscription(channel);
    let mounted = true;

    subscription
      .create()
      .then(() => {
        subscription.onMessage(() => {
          if (mounted) onEventRef.current();
        });
      })
      .catch(() => {});

    return () => {
      mounted = false;
      subscription.delete().catch(() => {});
    };
  }, [channel]);
}
