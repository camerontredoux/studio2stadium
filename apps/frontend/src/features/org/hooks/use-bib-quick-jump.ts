import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { scoutingQueries } from "@/features/org/api/scouting-queries";

export function useBibQuickJump(slug: string) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  return async (query: string): Promise<boolean> => {
    if (!/^\d+$/.test(query)) return false;
    const data = await qc.fetchQuery(
      scoutingQueries.dancers(slug, { bib: Number(query) }),
    );
    if (Array.isArray(data) && data.length === 1) {
      await navigate({
        to: "/$orgSlug/coach/dancers/$rosterId",
        params: { orgSlug: slug, rosterId: data[0]!.rosterId },
      });
      return true;
    }
    return false;
  };
}
