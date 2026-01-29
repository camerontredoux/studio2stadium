import "./index.css";

import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";

import { queryClient } from "./lib/query-client";

import { routeTree } from "@/routeTree.gen";
import { createRouter } from "@tanstack/react-router";

import qs from "qs";

const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,
  context: {
    queryClient,
  },
  stringifySearch: (search) =>
    qs.stringify(search, {
      arrayFormat: "comma",
      addQueryPrefix: true,
      // encodeValuesOnly: true,
      encode: false,
    }),
  parseSearch: (searchStr) => qs.parse(searchStr, { ignoreQueryPrefix: true }),
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
