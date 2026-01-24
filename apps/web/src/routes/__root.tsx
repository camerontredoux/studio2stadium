import { TanStackDevtools } from "@tanstack/react-devtools";
import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

import { ToastProvider } from "@/components/ui/toast";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <ToastProvider position="top-center">
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
    </ToastProvider>
  ),
});
