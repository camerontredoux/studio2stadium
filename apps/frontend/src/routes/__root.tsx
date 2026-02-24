import { TanStackDevtools } from "@tanstack/react-devtools";
import {
  Outlet,
  createRootRouteWithContext,
  useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

import "@stripe/stripe-js";

import { useIsFetching, type QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { useEffect } from "react";
import { Fragment } from "react/jsx-runtime";
import { useTernaryDarkMode } from "usehooks-ts";

import NProgress from "nprogress";

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

function RootComponent() {
  const { isDarkMode } = useTernaryDarkMode({ localStorageKey: "theme" });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  return (
    <Fragment>
      <RouterProgressBar />
      <Outlet />
      <TanStackDevtools
        config={{
          position: "bottom-right",
        }}
        plugins={[
          {
            name: "Tanstack Router",
            render: <TanStackRouterDevtoolsPanel />,
          },
          {
            name: "Tanstack Query",
            render: <ReactQueryDevtoolsPanel />,
          },
        ]}
      />
    </Fragment>
  );
}

NProgress.configure({
  showSpinner: false,
  trickleSpeed: 100,
});

function RouterProgressBar() {
  const isPending = useRouterState({ select: (s) => s.status === "pending" });
  const isFetching = useIsFetching();

  const isLoading = isPending && isFetching > 0;

  useEffect(() => {
    if (isLoading) NProgress.start();
    else NProgress.done();
  }, [isLoading]);

  return null;
}
