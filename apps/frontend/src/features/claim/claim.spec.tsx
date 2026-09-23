import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ClaimOrg, Claimed, ClaimError } from "./components/claim-org";
import { claimAccess, claimedDestination } from "./lib";

/** Server-renders inside a router and a query client, as the page needs. */
async function render(node: ReactNode) {
  const rootRoute = createRootRoute({ component: () => node });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  await router.load();
  return renderToString(
    <QueryClientProvider client={new QueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

const session = { id: "u1", displayEmail: "ada@example.com" };
const TOKEN = "t".repeat(64);

describe("claim page", () => {
  it("offers the claim to the account the link was emailed to", async () => {
    const html = await render(
      <ClaimOrg session={session} token={TOKEN} userId="u1" />,
    );

    expect(html).toContain("Claim your Org");
    expect(html).not.toContain("Different account");
  });

  it("tells a user signed in as another account to switch, with no claim button", async () => {
    const html = await render(
      <ClaimOrg session={session} token={TOKEN} userId="someone-else" />,
    );

    expect(html).toContain("Different account");
    expect(html).toContain("ada@example.com");
    expect(html).toContain("Sign out");
    expect(html).not.toContain("Claim your Org");
  });

  it("links a claimed Org's admin area", async () => {
    const html = await render(
      <Claimed
        orgs={[
          {
            name: "Summit Dance Co",
            slug: "summit",
            url: "https://app.example.com/o/summit/admin",
          },
        ]}
      />,
    );

    expect(html).toContain("Summit Dance Co");
    expect(html).toContain('href="/o/summit/admin"');
  });

  it("points a refused claim at Forgot password", async () => {
    const html = await render(
      <ClaimError message="This claim link has expired or was already used." />,
    );

    expect(html).toContain("expired");
    expect(html).toContain("Forgot password");
  });
});

describe("claim helpers", () => {
  it("allows only the account the link names", () => {
    expect(claimAccess({ id: "u1" }, "u1")).toBe("ready");
    expect(claimAccess({ id: "u2" }, "u1")).toBe("wrong_account");
  });

  it("sends a user to the first claimed Org, or nowhere when none", () => {
    expect(claimedDestination([{ slug: "a" }, { slug: "b" }])).toEqual({
      to: "/o/$orgSlug/admin",
      params: { orgSlug: "a" },
    });
    expect(claimedDestination([])).toBeNull();
  });
});
