import env from "#start/env";

// Deletes a Cloudflare Stream video. A 404 means it is already gone, which
// counts as success.
export async function deleteStreamVideo(mediaId: string) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env.get("CLOUDFLARE_ACCOUNT_ID")}/stream/${mediaId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${env.get("CLOUDFLARE_STREAM_TOKEN")}`,
      },
    }
  );

  if (!response.ok && response.status !== 404) {
    throw new Error(
      `Failed to delete video from Cloudflare: ${response.status}`
    );
  }
}
