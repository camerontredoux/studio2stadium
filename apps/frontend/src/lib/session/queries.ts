import type { paths } from "@/lib/api/types";
import { queryOptions } from "@tanstack/react-query";
import createFetchClient from "openapi-fetch";
import { $api } from "../api/client";
import { SessionNetworkError } from "./errors";

const client = createFetchClient<paths>({
  baseUrl: import.meta.env.VITE_API_URL,
  credentials: "include",
});

export const sessionQueries = {
  all: () => ["session"] as const,
  session: () => {
    return queryOptions({
      queryKey: sessionQueries.all(),
      queryFn: async () => {
        try {
          const { data, error, response } = await client.GET("/auth/session");

          // Essential - causes redirect on _app/route.tsx
          if (error || response?.status >= 500) {
            return null;
          }

          return data;
        } catch {
          throw new SessionNetworkError();
        }
      },
      staleTime: Infinity,
      gcTime: Infinity,
    });
  },
  subscribed: () => {
    return $api.queryOptions(
      "get",
      "/subscriptions/status",
      {},
      { staleTime: Infinity, gcTime: Infinity },
    );
  },
};
