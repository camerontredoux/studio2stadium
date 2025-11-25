import { BaseCommand, args, flags } from "@adonisjs/core/ace";
import type { CommandOptions } from "@adonisjs/core/types/ace";
import string from "@poppinss/utils/string";
import StringBuilder from "@poppinss/utils/string_builder";
import { join } from "node:path";

export default class MakeFeature extends BaseCommand {
  static commandName = "make:feature";
  static description = "Create a new feature with controller, service, and validator";

  static options: CommandOptions = {
    startApp: false,
  };

  static help = [
    "Creates a complete feature structure with:",
    "  - Controller",
    "  - Service",
    "  - Validator",
    "",
    "Example:",
    "{{ binaryName }} make:feature create_user users",
  ];

  @args.string({
    description: "The name of the feature (e.g., create_user, update_post)",
    argumentName: "feature",
    parse: (input) => string.snakeCase(input),
  })
  declare name: string;

  @args.string({
    description: "The feature's domain folder (e.g., users, posts)",
    parse: (input) => string.snakeCase(input),
  })
  declare domain: string;

  @flags.boolean({
    description: "Force overwite existing feature files",
    alias: "f",
  })
  declare force?: boolean;

  async run() {
    this.logger.info(
      `Creating feature ${this.colors.yellow(this.name)} in domain ${this.colors.yellow(this.domain)}`
    );

    const codemods = await this.createCodemods();
    const stubsRoot = this.app.commandsPath("stubs/make_feature");

    const domainDirectory = join("app/features", this.domain);
    const relativeDirectory = join(domainDirectory, this.name);
    const directory = this.app.makePath(relativeDirectory);

    await codemods.makeUsingStub(stubsRoot, "routes.stub", {
      routes: {
        path: this.app.makePath(domainDirectory, `${this.domain}.routes.ts`),
        name: this.domain,
      },
    });

    if (this.force) {
      codemods.overwriteExisting = true;
    }

    const controllerName = this.pascalCase(this.name).suffix("Controller").toString();
    const serviceName = this.pascalCase(this.name).suffix("Service").toString();
    const validatorName = this.pascalCase(this.name).suffix("Validator").toString();

    const schemaName = this.camelCase(this.name).suffix("Schema").toString();

    const validatorPath = this.makeFilename(".validator.ts");

    try {
      // Create controller
      await codemods.makeUsingStub(stubsRoot, "controller.stub", {
        controller: {
          name: controllerName,
          path: this.app.makePath(directory, this.makeFilename(".controller.ts")),
        },
        service: {
          name: serviceName,
          path: this.makeFilename(".service.js"),
        },
        validator: {
          name: validatorName,
          path: this.makeFilename(".validator.js"),
        },
      });

      // Create service
      await codemods.makeUsingStub(stubsRoot, "service.stub", {
        service: {
          name: serviceName,
          path: this.app.makePath(directory, this.makeFilename(".service.ts")),
        },
        validator: {
          name: validatorName,
          path: validatorPath,
        },
      });

      // Create validator
      await codemods.makeUsingStub(stubsRoot, "validator.stub", {
        validator: {
          name: validatorName,
          schema: schemaName,
          path: this.app.makePath(directory, validatorPath),
        },
      });

      this.logger.success(
        `Feature created at ${this.colors.yellow().underline(relativeDirectory)} ${this.colors.dim("(cmd + click)")}`
      );
    } catch (error) {
      this.logger.error("Failed to create feature");
      this.error = error;
      this.exitCode = 1;
    }
  }

  private pascalCase(value: string) {
    return new StringBuilder(value).pascalCase();
  }

  private camelCase(value: string) {
    return new StringBuilder(value).camelCase();
  }

  private makeFilename(path: string) {
    return new StringBuilder(this.name).ext(path).toString();
  }
}
