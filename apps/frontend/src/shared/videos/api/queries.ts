import { $api, client } from "@/lib/api/client";
import { queryOptions } from "@tanstack/react-query";

const UPLOAD_CHECK_FAILURE_LIMIT = 5;

// A server that keeps failing the check (a persistent 5xx) would otherwise
// be polled forever. After this many failed checks polling stops, and the
// watchers drop the upload the same way they drop one the server no longer
// has.
export function uploadCheckGaveUp(state: { errorUpdateCount: number }) {
  return state.errorUpdateCount >= UPLOAD_CHECK_FAILURE_LIMIT;
}

export const videoQueries = {
  permissions: () => $api.queryOptions("get", "/videos/permissions"),
  // Polls one upload until Cloudflare finishes it. `null` means the server
  // no longer has it: deleted, or it belongs to another account.
  upload: (mediaId: string) =>
    queryOptions({
      queryKey: ["video-uploads", mediaId],
      queryFn: async () => {
        const { data, response } = await client.GET(
          "/videos/uploads/{mediaId}",
          { params: { path: { mediaId } } },
        );
        if (response.status === 404) return null;
        if (!data) throw new Error("Could not check the video upload");
        return data;
      },
      refetchInterval: (query) =>
        uploadCheckGaveUp(query.state) ? false : 5000,
    }),
};
