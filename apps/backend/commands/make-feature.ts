import { BaseCommand, args, flags } from "@adonisjs/core/ace";
import type { CommandOptions } from "@adonisjs/core/types/ace";
import string from "@poppinss/utils/string";
import StringBuilder from "@poppinss/utils/string_builder";
import { join } from "node:path";

export default class MakeFeature extends BaseCommand {
  static commandName = "make:feature";
  static description =
    "Create a new feature with controller, service, and validator";

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
    description: "The name of the feature (e.g., create-user, update-post)",
    argumentName: "feature",
    parse: (input) => string.dashCase(input),
  })
  declare name: string;

  @args.string({
    description: "The feature's domain folder (e.g., users, posts)",
    parse: (input) => string.dashCase(input),
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
    const stubsRoot = this.app.commandsPath("stubs/make-feature");

    const domainDirectory = join("app/modules", this.domain);
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

    const controllerName = this.addSuffix("Controller", "pascalCase");
    const serviceName = this.addSuffix("Service", "pascalCase");
    const validatorName = this.addSuffix("Validator", "camelCase");
    const validatorType = this.addSuffix("Validator", "pascalCase");

    const controllerPath = this.makeFilename(".controller.ts");
    const validatorPath = this.makeFilename(".validator.ts");
    const servicePath = this.makeFilename(".service.ts");

    try {
      await codemods.makeUsingStub(stubsRoot, "controller.stub", {
        controller: {
          name: controllerName,
          path: this.app.makePath(directory, controllerPath),
        },
        service: {
          name: serviceName,
          path: servicePath,
        },
        validator: {
          name: validatorName,
          path: validatorPath,
        },
      });

      await codemods.makeUsingStub(stubsRoot, "service.stub", {
        service: {
          name: serviceName,
          path: this.app.makePath(directory, servicePath),
        },
        validator: {
          name: validatorName,
          type: validatorType,
          path: validatorPath,
        },
      });

      await codemods.makeUsingStub(stubsRoot, "validator.stub", {
        validator: {
          name: validatorName,
          type: validatorType,
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

  private addSuffix(suffix: string, textCase: "pascalCase" | "camelCase") {
    const result = new StringBuilder(this.name).suffix(suffix);

    switch (textCase) {
      case "camelCase": {
        return result.camelCase().toString();
      }
      case "pascalCase": {
        return result.pascalCase().toString();
      }
    }
  }

  private makeFilename(path: string) {
    return new StringBuilder(this.name).ext(path).toString();
  }
}
