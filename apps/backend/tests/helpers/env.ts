import env from "#start/env";

/**
 * Remember some settings and return a function that puts them back.
 * `env.set(key, undefined)` would store the string "undefined", so a setting
 * that was unset comes back as an empty string, which every reader treats
 * as unset.
 */
export function snapshotEnv(keys: readonly string[]) {
  const saved = new Map(keys.map((k) => [k, env.get(k as never)]));
  return () => {
    for (const [k, v] of saved) {
      env.set(k as never, (v === undefined ? "" : v) as never);
    }
  };
}
