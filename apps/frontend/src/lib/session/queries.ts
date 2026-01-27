import type { paths } from "@/lib/api/types";
import { queryOptions } from "@tanstack/react-query";
import createFetchClient from "openapi-fetch";

const client = createFetchClient<paths>({
  baseUrl: "http://localhost:3333",
  headers: {
    "Content-Type": "application/json",
  },
  credentials: "include",
});

export const queries = {
  all: () => ["session"] as const,
  session: () => {
    return queryOptions({
      queryKey: queries.all(),
      queryFn: async () => {
        try {
          const { data, error, response } = await client.GET("/auth/session");

          // Essential - causes redirect on _app/route.tsx
          if (error || response?.status >= 500) {
            return null;
          }

          return data;
        } catch {
          return null;
          // throw new SessionNetworkError();
        }
      },
      staleTime: Infinity,
      gcTime: Infinity,
    });
  },
};
