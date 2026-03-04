import { videoUploads } from "#database/schema/media";
import { DatabaseService } from "#database/service";
import env from "#start/env";
import { inject } from "@adonisjs/core";

interface InitiateUploadParams {
  userId: string;
  uploadLength: string;
  uploadMetadata: string;
}

interface InitiateUploadResult {
  location: string;
  streamMediaId: string;
}

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async initiateUpload(
    params: InitiateUploadParams
  ): Promise<InitiateUploadResult> {
    const { userId, uploadLength, uploadMetadata } = params;

    // Append maxDurationSeconds to metadata
    const maxDurationMetadata = `maxDurationSeconds ${Buffer.from("120").toString("base64")}`;
    const fullMetadata = uploadMetadata
      ? `${uploadMetadata},${maxDurationMetadata}`
      : maxDurationMetadata;

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${env.get("CLOUDFLARE_ACCOUNT_ID")}/stream?direct_user=true`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.get("CLOUDFLARE_STREAM_TOKEN")}`,
          "Tus-Resumable": "1.0.0",
          "Upload-Length": uploadLength,
          "Upload-Metadata": fullMetadata,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Cloudflare Stream API error: ${error}`);
    }

    const location = response.headers.get("location");
    const streamMediaId = response.headers.get("stream-media-id");

    if (!location || !streamMediaId) {
      throw new Error(
        "Missing location or stream-media-id in Cloudflare response"
      );
    }

    // Create video upload record
    await this.db.use((db) =>
      db.insert(videoUploads).values({
        userId,
        cloudflareMediaId: streamMediaId,
        status: "pending",
      })
    );

    return { location, streamMediaId };
  }
}
