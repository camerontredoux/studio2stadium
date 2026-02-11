import { QueryClient, type QueryKey } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: 1000 * 60,
    },
    mutations: {
      retry: false,
      onSettled: (_data, _error, _variables, _context, mutation) => {
        const queries = mutation.meta?.invalidateQueries;
        if (queries) {
          for (const queryKey of queries) {
            queryClient.invalidateQueries({ queryKey });
          }
        }
      },
    },
  },
});

declare module "@tanstack/react-query" {
  interface Register {
    mutationMeta: {
      invalidateQueries?: QueryKey[];
    };
  }
}
