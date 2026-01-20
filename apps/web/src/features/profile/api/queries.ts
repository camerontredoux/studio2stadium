import { mockApi } from "@/lib/mock-api";
import { queryOptions } from "@tanstack/react-query";

export const queries = {
  all: () => ["profile"],
  profiles: (username: string) => [...queries.all(), username],
  profile: (username: string) =>
    queryOptions({
      queryKey: queries.profiles(username),
      queryFn: () => mockApi.success({ username, type: "dancer" }),
    }),
};
