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

// Keys the server sets on every Stream upload. A client copy of any of them
// is dropped so it cannot change the owner or lift the duration cap.
const SERVER_METADATA_KEYS = new Set(["userid", "maxdurationseconds"]);

const encode = (value: string) => Buffer.from(value).toString("base64");

// Headers that tie a tus upload to its owner: Cloudflare stores
// `Upload-Creator` as the video's `creator`, and `userId` lands in its `meta`.
export function streamUploadHeaders(clientMetadata: string, userId: string) {
  const clientPairs = clientMetadata
    .split(",")
    .map((pair) => pair.trim())
    .filter(
      (pair) =>
        pair && !SERVER_METADATA_KEYS.has(pair.split(" ")[0].toLowerCase())
    );

  return {
    "Upload-Creator": userId,
    "Upload-Metadata": [
      ...clientPairs,
      `maxDurationSeconds ${encode("120")}`,
      `userId ${encode(userId)}`,
    ].join(","),
  };
}
