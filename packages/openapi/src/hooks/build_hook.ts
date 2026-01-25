import type { AssemblerHookHandler } from "@adonisjs/core/types/app";
import { exec as cpExec } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import util from "node:util";

const exec = util.promisify(cpExec);

export default async function tuyauBuildHook({
  logger,
}: Parameters<AssemblerHookHandler>[0]) {
  logger.info("generating open api file", { suffix: "openapi" });

  if (!existsSync("./build/.adonisjs/openapi.json")) {
    await mkdir("./build/.adonisjs", { recursive: true });
  }

  const { stderr } = await exec(
    "node ace generate:openapi --destination=./build/.adonisjs/openapi.json"
  );

  if (stderr) throw new Error(stderr);
}
