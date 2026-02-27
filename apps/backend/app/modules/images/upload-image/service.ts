import drive from "@adonisjs/drive/services/main";
import { randomUUID } from "node:crypto";
import { type Validator } from "./validator.ts";

export class UploadImageService {
  async execute(userId: string, { contentType, type }: Validator) {
    const disk = drive.use("r2");

    const key = `${type}/${userId}/${randomUUID()}`;

    const signedUrl = await disk.getSignedUploadUrl(key, {
      expiresIn: "15 mins",
      contentType,
    });

    return { key, url: signedUrl };
  }
}
