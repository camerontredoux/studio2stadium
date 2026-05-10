import { Transmit } from "@adonisjs/transmit-client";
import { useEffect, useRef } from "react";

let transmit: Transmit | null = null;

function getTransmit() {
  if (!transmit) {
    transmit = new Transmit({
      baseUrl: window.location.origin,
    });
  }
  return transmit;
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
