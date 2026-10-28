import { useQuery } from "@tanstack/react-query";

import type { RosterEntry } from "@/features/org/api/roster-queries";
import { client } from "@/lib/api/client";

// The roster list caps `limit` at 200, so a large roster takes several pages.
const PAGE_SIZE = 200;

/**
 * Every dancer roster entry of the event, by bib. The key sits under the roster
 * list prefix, so roster mutations and claim resolves invalidate it too.
 */
export function useEventDancers(
  slug: string,
  eventId: string,
  enabled: boolean,
) {
  return useQuery({
    queryKey: [
      "get",
      "/orgs/{slug}/events/{id}/rosters",
      { scope: "all-dancers", slug, eventId },
    ],
    enabled,
    queryFn: async ({ signal }) => {
      const rows: RosterEntry[] = [];
      for (let page = 0; ; page++) {
        const { data, error } = await client.GET(
          "/orgs/{slug}/events/{id}/rosters",
          {
            params: {
              path: { slug, id: eventId },
              query: {
                type: "dancer",
                page,
                limit: PAGE_SIZE,
                sortBy: "bibNumber",
                sortDir: "asc",
              },
            },
            signal,
          },
        );
        if (error) throw error;
        rows.push(...data.data);
        if (data.data.length < PAGE_SIZE || rows.length >= data.total) {
          return rows;
        }
      }
    },
  });
}
