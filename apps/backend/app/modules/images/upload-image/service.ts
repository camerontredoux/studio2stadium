import drive from "@adonisjs/drive/services/main";
import string from "@poppinss/utils/string";
import { type Validator } from "./validator.ts";

export class UploadImageService {
  async execute(userId: string, { contentType, type }: Validator) {
    const disk = drive.use("r2");

    const key = `${type}/${userId}/${string.uuid()}`;

    const signedUrl = await disk.getSignedUploadUrl(key, {
      expiresIn: "15 mins",
      contentType,
    });

    return { key, url: signedUrl };
  }
}
