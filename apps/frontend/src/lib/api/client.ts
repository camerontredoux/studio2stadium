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
      // Our proxy chain (Cloudflare/Fly) rewrites 204 No Content responses into
      // a 200 with an empty body and no Content-Length header. openapi-fetch's
      // no-content guard only catches `status === 204` or `Content-Length === 0`,
      // so it falls through and calls `.json()` on the empty body, throwing
      // "Unexpected end of JSON input". Normalize a truly empty 2xx response so
      // the guard recognizes it as no-content.
      if (
        response.ok &&
        response.status !== 204 &&
        !response.headers.get("content-type")?.includes("application/json")
      ) {
        const text = await response.clone().text();
        if (text.length === 0) {
          const headers = new Headers(response.headers);
          headers.set("Content-Length", "0");
          return new Response(null, {
            status: response.status,
            statusText: response.statusText,
            headers,
          });
        }
      }
      return response;
    },
  });

  return client;
};

export const client = createClient();

export const $api = createQueryClient(client);
