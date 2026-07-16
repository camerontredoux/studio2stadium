/*
|--------------------------------------------------------------------------
| Test runner entrypoint
|--------------------------------------------------------------------------
|
| The "test.ts" file is the entrypoint for running tests using Japa.
|
| Either you can run this file directly or use the "test"
| command to run this file and monitor file changes.
|
*/

process.env.NODE_ENV = "test";

import "reflect-metadata";
import { Ignitor, prettyPrintError } from "@adonisjs/core";
import { configure, processCLIArgs, run } from "@japa/runner";

/**
 * URL to the application root. AdonisJS need it to resolve
 * paths to file and directories for scaffolding commands
 */
const APP_ROOT = new URL("../", import.meta.url);

/**
 * The importer is used to import files in context of the
 * application.
 */
const IMPORTER = (filePath: string) => {
  if (filePath.startsWith("./") || filePath.startsWith("../")) {
    return import(new URL(filePath, APP_ROOT).href);
  }
  return import(filePath);
};

new Ignitor(APP_ROOT, { importer: IMPORTER })
  .tap((app) => {
    app.booting(async () => {
      await import("#start/env");
    });
    app.listen("SIGTERM", () => app.terminate());
    app.listenIf(app.managedByPm2, "SIGINT", () => app.terminate());
  })
  .testRunner()
  .configure(async (app) => {
    const { runnerHooks, ...config } = await import("../tests/bootstrap.ts");

    processCLIArgs(process.argv.splice(2));
    configure({
      ...app.rcFile.tests,
      ...config,
      ...{
        setup: runnerHooks.setup,
        teardown: runnerHooks.teardown.concat([() => app.terminate()]),
      },
    });
  })
  .run(() => run())
  .catch((error) => {
    process.exitCode = 1;
    prettyPrintError(error);
  })
  .finally(async () => {
    /**
     * Something in the test environment keeps the event loop alive after Japa
     * has finished and the app has terminated, so the runner would otherwise
     * hang forever instead of exiting. Each hung run holds onto its Postgres
     * connections, so repeated runs exhaust the server's connection limit.
     * Force the exit, preserving whatever exit code Japa set.
     */
    await flushOutput();
    process.exit(process.exitCode ?? 0);
  });

/**
 * process.exit() discards anything still buffered in stdout/stderr, which
 * truncates the reporter's output when it is piped to a file or another
 * process. Wait for both streams to drain first.
 */
function flushOutput() {
  return new Promise<void>((resolve) => {
    let pending = 0;
    const settle = () => {
      pending -= 1;
      if (pending === 0) resolve();
    };

    for (const stream of [process.stdout, process.stderr]) {
      if (stream.writableLength > 0) {
        pending += 1;
        stream.write("", settle);
      }
    }

    if (pending === 0) resolve();
  });
}
