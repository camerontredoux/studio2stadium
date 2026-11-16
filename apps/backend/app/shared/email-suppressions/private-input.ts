import { existsSync, realpathSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";

/**
 * The repository (or deployed app) folder the given app root sits in: the
 * nearest ancestor holding `.git` or `pnpm-workspace.yaml`, else the app
 * root itself.
 */
export function projectRoot(appRoot: string): string {
  let dir = resolve(appRoot);
  for (;;) {
    if (
      existsSync(join(dir, ".git")) ||
      existsSync(join(dir, "pnpm-workspace.yaml"))
    ) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) return resolve(appRoot);
    dir = parent;
  }
}

/**
 * Exports hold real people's addresses, so they must never sit where they
 * could be committed or shipped: refuse any file inside the project or the
 * app root. Returns the resolved path, or a reason to refuse.
 */
export function privateInputPath(
  file: string,
  appRoot: string
): { path: string } | { refused: string } {
  const absolute = resolve(file);
  if (!existsSync(absolute)) return { refused: "the file does not exist" };
  const real = realpathSync(absolute);

  for (const root of [projectRoot(appRoot), resolve(appRoot)]) {
    const realRoot = existsSync(root) ? realpathSync(root) : root;
    const rel = relative(realRoot, real);
    if (rel === "" || (!rel.startsWith("..") && !isAbsolute(rel))) {
      return {
        refused:
          "the file is inside the project; keep exports outside it (for example in /tmp) so they are never committed or deployed",
      };
    }
  }
  return { path: real };
}
