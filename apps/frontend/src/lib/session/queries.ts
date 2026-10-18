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
  subscribed: (enabled: boolean = true) => {
    return $api.queryOptions(
      "get",
      "/subscriptions",
      {},
      { staleTime: Infinity, gcTime: Infinity, enabled },
    );
  },
  application: (enabled?: boolean) => {
    return queryOptions({
      queryKey: ["application"],
      queryFn: async () => {
        const { data, error, response } = await client
          .GET("/application")
          .catch(() => {
            throw new SessionNetworkError();
          });
        const { status } = response;

        // A school without a profile gets 403, and has no application yet.
        // Any other failure throws, so the route shows its error instead of
        // sending a school that has applied back to onboarding.
        if (status === 403) return null;
        if (error) {
          throw new Error(`Couldn't load your application (status ${status}).`);
        }

        return data;
      },
      enabled,
      staleTime: Infinity,
      gcTime: Infinity,
    });
  },
};
