import type { ApiSchemas } from "@/lib/api/client";

export type PublicOrg = ApiSchemas["OrgsResponse"][number];

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${import.meta.env.VITE_API_URL}${path}`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to load organizations");
  }
  return response.json() as Promise<T>;
}

export const publicOrgsQueries = {
  list: () => ({
    queryKey: ["orgs", "list"] as const,
    queryFn: () => fetchJson<PublicOrg[]>("/orgs"),
    staleTime: 60_000,
  }),
};
