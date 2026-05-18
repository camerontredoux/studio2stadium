import drive from "@adonisjs/drive/services/main";
import { randomUUID } from "node:crypto";
import type { Validator } from "./validator.ts";

export class AudioUploadUrlService {
  async execute(eventId: string, input: Validator) {
    const disk = drive.use("r2");
    const key = `event-audio/${eventId}/${randomUUID()}.mp3`;

    const url = await disk.getSignedUploadUrl(key, {
      expiresIn: "15 mins",
      contentType: input.contentType,
    });

    return { key, url };
  }
}
