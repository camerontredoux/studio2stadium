import { videoUploads } from "#database/schema/media";
import { DatabaseService } from "#database/service";
import env from "#start/env";
import { inject } from "@adonisjs/core";
import {
  resolveSchoolUserByUsername,
} from "../resolve-school-user.ts";

interface InitiateUploadParams {
  username: string;
  uploadLength: string;
  uploadMetadata: string;
}

type InitiateUploadResult =
  | { location: string; streamMediaId: string }
  | { error: string; message: string };

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async initiateUpload(
    params: InitiateUploadParams
  ): Promise<InitiateUploadResult> {
    const { username, uploadLength, uploadMetadata } = params;

    const resolved = await resolveSchoolUserByUsername(this.db, username);
    if (!resolved.ok) {
      return { error: "not_found", message: resolved.error };
    }

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

    await this.db.use((db) =>
      db.insert(videoUploads).values({
        userId: resolved.school.userId,
        cloudflareMediaId: streamMediaId,
        status: "pending",
      })
    );

    return { location, streamMediaId };
  }
}
