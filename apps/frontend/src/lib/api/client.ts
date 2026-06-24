import createFetchClient from "openapi-fetch";
import createQueryClient from "openapi-react-query";
import type { components, paths } from "./types";

export type ApiSchemas = components["schemas"];

export const createClient = () => {
  const client = createFetchClient<paths, "application/json">({
    baseUrl: import.meta.env.VITE_API_URL,
    credentials: "include",
  });

  client.use({
    onRequest: ({ request }) => {
      // When an admin is "viewing as" a coach/dancer, tell the backend which
      // staff (preview) roster to resolve. Derived from the current path so it
      // survives reloads. Harmless for real participants — they have a single
      // roster of their own type, which this filter matches.
      if (typeof window !== "undefined") {
        const path = window.location.pathname;
        const actAs = path.includes("/coach")
          ? "coach"
          : path.includes("/dancer")
            ? "dancer"
            : null;
        if (actAs) request.headers.set("x-act-as-type", actAs);
      }
      return request;
    },
    onResponse: async ({ response }) => {
      if (response.status === 401) {
        window.location.href = "/login";
      }
      return response;
    },
  });

  return client;
};

export const client = createClient();

export const $api = createQueryClient(client);
