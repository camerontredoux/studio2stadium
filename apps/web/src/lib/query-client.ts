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
        if (mutation.meta?.invalidateQuery) {
          queryClient.invalidateQueries({
            queryKey: mutation.meta.invalidateQuery,
          });
        }
      },
    },
  },
});

declare module "@tanstack/react-query" {
  interface Register {
    mutationMeta: {
      invalidateQuery?: QueryKey;
    };
  }
}
