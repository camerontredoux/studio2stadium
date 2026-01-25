import { BaseCommand, flags } from "@adonisjs/core/ace";
import type { CommandOptions } from "@adonisjs/core/types/ace";
import type { TuyauConfig } from "@tuyau/core/types";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { OpenApiGenerator } from "../src/generator.js";
import { metaStore } from "../src/meta_store.js";

export default class CodegenTypes extends BaseCommand {
  static override commandName = "generate:openapi";
  static override description =
    "Automatically a full OpenAPI documentation from your codebase";
  static override options: CommandOptions = { startApp: true };

  @flags.boolean({ description: "Verbose logs", default: false, alias: "v" })
  declare verbose: boolean;

  @flags.string({ description: "Destination file" })
  declare destination: string;

  /**
   * Execute command
   */
  override async run() {
    const config = this.app.config.get<TuyauConfig>("openapi");
    const tsConfigFilePath = join(
      fileURLToPath(this.app.appRoot),
      "./tsconfig.json"
    );
    this.destination =
      this.destination ||
      join(fileURLToPath(this.app.appRoot), "./openapi.json");

    const openApiSpec = await new OpenApiGenerator(
      config,
      metaStore,
      tsConfigFilePath
    ).generate();

    writeFile(this.destination, openApiSpec, "utf-8");
    this.logger.success(`OpenAPI spec generated at ${this.destination}`);
  }
}
