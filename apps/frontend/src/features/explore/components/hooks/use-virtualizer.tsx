"use no memo";

import { useElementScrollRestoration } from "@tanstack/react-router";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";
import type { School } from "../types/school";

export function useVirtualizer({ rows }: { rows: School[] }) {
  const scrollEntry = useElementScrollRestoration({
    getElement: () => window,
  });

  const parentRef = useRef<HTMLDivElement>(null);

  // eslint-disable-next-line react-hooks/refs
  const rowVirtualizer = useWindowVirtualizer({
    count: rows.length,
    estimateSize: () => 128,
    gap: 8,
    // eslint-disable-next-line react-hooks/refs
    scrollMargin: parentRef.current?.offsetTop ?? 0,
    initialOffset: scrollEntry?.scrollY,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  return { parentRef, rowVirtualizer, virtualItems };
}
