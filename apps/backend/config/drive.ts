import { localDisk } from "#shared/storage/local-disk";
import env from "#start/env";
import app from "@adonisjs/core/services/app";
import { defineConfig, services } from "@adonisjs/drive";

const driveConfig = defineConfig({
  default: env.get("DRIVE_DISK"),

  /**
   * The services object can be used to configure multiple file system
   * services each using the same or a different driver.
   */
  services: {
    // The R2 variables are required unless DRIVE_DISK=fs (start/env.ts).
    r2: services.s3({
      credentials: {
        accessKeyId: env.get("R2_KEY", ""),
        secretAccessKey: env.get("R2_SECRET", ""),
      },
      region: "auto",
      bucket: env.get("R2_BUCKET", ""),
      endpoint: env.get("R2_ENDPOINT", ""),
      visibility: "public",
    }),

    // Local development only: files in apps/backend/storage, served and
    // uploaded under /uploads on this backend.
    fs: localDisk({
      enabled: env.get("DRIVE_DISK") === "fs",
      location: app.makePath("storage"),
      appUrl: env.get("API_URL"),
      routeBasePath: "/uploads",
      maxUploadBytes: 100 * 1024 * 1024,
    }),
  },
});

export default driveConfig;

declare module "@adonisjs/drive/types" {
  export interface DriveDisks extends InferDriveDisks<typeof driveConfig> {}
}
