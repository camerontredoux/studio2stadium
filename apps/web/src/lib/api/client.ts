import createFetchClient from "openapi-fetch";
import createQueryClient from "openapi-react-query";
import type { paths } from "./types";

export const createClient = () => {
  const client = createFetchClient<paths, "application/json">({
    baseUrl: "http://localhost:3333",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  client.use({
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
