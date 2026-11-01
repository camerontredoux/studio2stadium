import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { needsActivationPrompt } from "@/features/org/lib/event-activation";

import { InactiveEventPrompt } from "./inactive-event-prompt";

const bought = { id: "e1", name: "Summit 2026", isActive: false };

describe("needsActivationPrompt", () => {
  it("prompts when the Org's only event is inactive, as a bought event starts", () => {
    expect(needsActivationPrompt(bought, null)).toBe(true);
  });

  it("does not prompt for the active event", () => {
    expect(
      needsActivationPrompt({ ...bought, isActive: true }, { id: "e1" }),
    ).toBe(false);
  });

  it("does not prompt when another event is already active", () => {
    expect(needsActivationPrompt(bought, { id: "e2" })).toBe(false);
  });
});

describe("InactiveEventPrompt", () => {
  it("names the event and offers to review it and activate it", () => {
    const html = renderToString(
      <QueryClientProvider client={new QueryClient()}>
        <InactiveEventPrompt
          orgSlug="summit"
          event={bought}
          onReview={() => {}}
        />
      </QueryClientProvider>,
    );

    expect(html).toContain("Summit 2026");
    expect(html).toContain("isn’t active yet");
    expect(html).toContain("Review details");
    expect(html).toContain("Activate event");
  });
});
