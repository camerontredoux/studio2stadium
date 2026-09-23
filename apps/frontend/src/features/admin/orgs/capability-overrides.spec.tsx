import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { adminQueries } from "@/features/admin/api/queries";

import { EventCapabilitiesPanel } from "./components/event-capabilities-panel";
import {
  defaultChoiceLabel,
  overrideChoice,
  overridesWithChoice,
  type CapabilityResolution,
  type EventCapabilities,
} from "./capability-overrides";

const regionalWithExceptions: CapabilityResolution[] = [
  {
    capability: "callbacks",
    eventTierDefault: true,
    override: null,
    included: true,
  },
  {
    capability: "check_in",
    eventTierDefault: true,
    override: false,
    included: false,
  },
  {
    capability: "school_selections",
    eventTierDefault: true,
    override: null,
    included: true,
  },
  {
    capability: "video_library",
    eventTierDefault: false,
    override: true,
    included: true,
  },
];

describe("capability overrides", () => {
  it("reads an exception as a choice, and no exception as the default", () => {
    expect(regionalWithExceptions.map(overrideChoice)).toEqual([
      "default",
      "off",
      "default",
      "on",
    ]);
  });

  it("names what the Event Tier would give when left alone", () => {
    expect(defaultChoiceLabel(regionalWithExceptions[0]!)).toBe(
      "Event Tier default (included)",
    );
    expect(defaultChoiceLabel(regionalWithExceptions[3]!)).toBe(
      "Event Tier default (not included)",
    );
  });

  it("changes one capability and keeps the event's other exceptions", () => {
    expect(
      overridesWithChoice(regionalWithExceptions, "callbacks", "off"),
    ).toEqual({ callbacks: false, check_in: false, video_library: true });
  });

  it("clears an exception by handing the capability back to the Event Tier", () => {
    expect(
      overridesWithChoice(regionalWithExceptions, "check_in", "default"),
    ).toEqual({ video_library: true });
  });
});

/** Server-renders the panel with the Org's events already fetched. */
function renderPanel(orgId: string, events: EventCapabilities[]) {
  const queryClient = new QueryClient();
  queryClient.setQueryData(
    adminQueries.orgEventCapabilities(orgId).queryKey,
    events,
  );
  return renderToString(
    <QueryClientProvider client={queryClient}>
      <EventCapabilitiesPanel orgId={orgId} />
    </QueryClientProvider>,
  );
}

describe("event capabilities panel", () => {
  it("shows each event's Event Tier defaults and its exceptions apart", () => {
    const html = renderPanel("o1", [
      {
        id: "e1",
        name: "Spring Showcase",
        isActive: true,
        startDate: "2026-04-01",
        eventTier: "regional",
        capabilities: regionalWithExceptions,
      },
      {
        id: "e2",
        name: "Summer Combine",
        isActive: false,
        startDate: "2026-07-01",
        eventTier: "national",
        capabilities: regionalWithExceptions.map((resolution) => ({
          ...resolution,
          override: null,
          included: resolution.eventTierDefault,
        })),
      },
    ]);

    expect(html).toContain("Spring Showcase");
    expect(html).toContain("Summer Combine");
    expect(html).toContain("Regional");
    expect(html).toContain("National");
    // Two exceptions on the first event; everything else is a default.
    expect(html.match(/>Exception</g)).toHaveLength(2);
    expect(html.match(/>Event Tier</g)).toHaveLength(6);
  });

  it("says capabilities wait for an event when the Org has none", () => {
    expect(renderPanel("o2", [])).toContain("no events yet");
  });
});
