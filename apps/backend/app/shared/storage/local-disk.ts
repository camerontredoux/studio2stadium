import { RuntimeException } from "@adonisjs/core/exceptions";
import type { HttpContext, Router } from "@adonisjs/core/http";
import { Disk } from "@adonisjs/drive";
import { FSDriver } from "@adonisjs/drive/drivers/fs";
import type {
  ServiceConfigProvider,
  SignedURLOptions,
} from "@adonisjs/drive/types";
import { Transform } from "node:stream";

type LocalDiskOptions = {
  /** True only when DRIVE_DISK selects this disk. Off, it registers no routes. */
  enabled: boolean;
  /** Folder the files are written to. */
  location: string;
  /** This backend's base URL. The browser calls it from another origin. */
  appUrl: string;
  /** Path the files are served from and uploaded to, such as "/uploads". */
  routeBasePath: string;
  /** Largest body one signed upload accepts. */
  maxUploadBytes: number;
};

class UploadTooLargeError extends Error {}

/**
 * A local-folder disk for development, standing in for R2. Drive's own `fs`
 * service serves files but cannot sign uploads, and the browser uploads with
 * a presigned PUT (`getSignedUploadUrl`). This disk signs PUT URLs to a route
 * it registers, which checks the signature and writes the body to the folder.
 * It refuses to run in production.
 */
export function localDisk(
  options: LocalDiskOptions
): ServiceConfigProvider<() => FSDriver> {
  return {
    type: "provider",
    async resolver(name, app, locallyServed) {
      if (!options.enabled) {
        return () => {
          throw new RuntimeException(
            `The "${name}" disk is off. Set DRIVE_DISK=${name} to use it.`
          );
        };
      }
      if (app.inProduction) {
        throw new RuntimeException(
          `The "${name}" disk stores files on the server's own disk and cannot run in production. Set DRIVE_DISK=r2.`
        );
      }

      const routes = {
        serve: `drive.${name}.serve`,
        upload: `drive.${name}.upload`,
      };
      const router = await app.container.make("router");
      const driver = new FSDriver({
        location: options.location,
        visibility: "public",
        urlBuilder: createUrlBuilder(router, options.appUrl, routes),
      });

      // Ace commands (make:docs) skip the routes so the generated API docs
      // stay free of these development-only paths.
      if (app.getEnvironment() !== "console") {
        const pattern = `${options.routeBasePath.replace(/\/$/, "")}/*`;
        // Drive's provider registers the GET file server for this entry.
        locallyServed.push({
          service: name,
          routeName: routes.serve,
          routePattern: pattern,
        });
        const disk = new Disk(driver);
        router
          .put(pattern, (ctx) =>
            receiveUpload(ctx, disk, options.maxUploadBytes)
          )
          .as(routes.upload);
      }

      return () => driver;
    },
  };
}

function createUrlBuilder(
  router: Router,
  appUrl: string,
  routes: { serve: string; upload: string }
) {
  const base = (key: string) =>
    router
      .builder()
      .params({ "*": key.split("/") })
      .prefixUrl(appUrl);

  return {
    async generateURL(key: string) {
      return base(key).make(routes.serve);
    },
    async generateSignedURL(
      key: string,
      _filePath: string,
      { expiresIn, ...headers }: SignedURLOptions
    ) {
      return base(key).qs(headers).makeSigned(routes.serve, { expiresIn });
    },
    async generateSignedUploadURL(
      key: string,
      _filePath: string,
      { expiresIn, contentType }: SignedURLOptions
    ) {
      return base(key)
        .qs(contentType ? { contentType } : {})
        .makeSigned(routes.upload, { expiresIn });
    },
  };
}

/**
 * Stands in for R2's handling of a presigned PUT: the signature must be valid
 * and unexpired, and the Content-Type must match the one it was signed for.
 */
async function receiveUpload(
  { request, response }: HttpContext,
  disk: Disk,
  maxBytes: number
) {
  if (!request.hasValidSignature()) {
    return response.forbidden({
      message: "Upload link is invalid or expired.",
    });
  }

  const signedType = request.qs().contentType as string | undefined;
  if (signedType && request.header("content-type") !== signedType) {
    return response.forbidden({
      message: "Content-Type does not match the upload link.",
    });
  }

  if (Number(request.header("content-length") ?? 0) > maxBytes) {
    return response.status(413).send({ message: "File is too large." });
  }

  const key = (request.param("*") as string[]).join("/");
  let received = 0;
  const limit = new Transform({
    transform(chunk: Buffer, _encoding, done) {
      received += chunk.length;
      done(received > maxBytes ? new UploadTooLargeError() : null, chunk);
    },
  });

  // pipe() does not forward errors, so an aborted request ends the write too.
  request.request.once("error", (error) => limit.destroy(error));

  try {
    await disk.putStream(key, request.request.pipe(limit), {
      contentType: signedType,
    });
  } catch (error) {
    await disk.delete(key).catch(() => {});
    if (error instanceof UploadTooLargeError) {
      return response.status(413).send({ message: "File is too large." });
    }
    throw error;
  }

  return response.ok({});
}
