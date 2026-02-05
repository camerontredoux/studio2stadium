import { $api } from "@/lib/api/client";

export const queries = {
  all: () => ["explore"],
  filters: () => $api.queryOptions("get", "/schools/filters"),
  schools: (search: { [x: string]: string | string[] | undefined }) => {
    return $api.queryOptions("get", "/schools", {
      params: {
        query: {
          ...search,
        },
      },
    });
  },
};
