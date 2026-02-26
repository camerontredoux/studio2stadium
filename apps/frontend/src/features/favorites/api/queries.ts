import { $api } from "@/lib/api/client";

export const favoritesQueries = {
  favorites: () => $api.queryOptions("get", "/schools/me/favorites"),
};
