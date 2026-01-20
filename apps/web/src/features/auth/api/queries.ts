import { mockApi } from "@/lib/mock-api";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";

export const queries = {
  all: () => ["auth"],
  session: () =>
    queryOptions({
      queryKey: queries.all(),
      queryFn: () => mockApi.logged({ user: { id: "1", name: "John Doe" } }),
      staleTime: Infinity,
      gcTime: Infinity,
    }),
};

export const useSession = () => {
  const { data, ...rest } = useSuspenseQuery(queries.session());

  return { session: data, ...rest };
};
