import type { Router } from "@adonisjs/core/http";
import type { ApplicationService } from "@adonisjs/core/types";
import type { ResourceActionNames } from "@adonisjs/core/types/http";
import type { TuyauConfig } from "@tuyau/core/types";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { OpenAPIObject, OperationObject } from "openapi3-ts/oas31";

import type { RouteResourceOpenApiOptions } from "../src/bindings/routes.js";
import { registerRouteMacros } from "../src/bindings/routes.js";
import { metaStore } from "../src/meta_store.js";
import { scalarRenderer } from "../src/scalar/renderer.js";
import type { ReferenceConfiguration as ScalarConfiguration } from "../src/scalar/types/index.js";
import { swaggerUiRenderer } from "../src/swagger/renderer.js";
import type { SwaggerUIOptions } from "../src/swagger/types.js";

/**
 * Extend the TuyauConfig interface to include the OpenAPI configuration
 */
declare module "@tuyau/core/types" {
  export interface TuyauConfig {
    openapi?: {
      /*
       * The location of the OpenAPI spec file to serve
       * when in production mode
       *
       * @default .adonisjs/openapi.yaml
       */
      buildSpecPath?: string;

      /**
       * Provider to use for the OpenAPI UI
       *
       * @default scalar
       */
      provider?: "scalar" | "swagger-ui";

      /**
       * Options for configuring Scalar if `provider` is set to `scalar`
       * See https://github.com/scalar/scalar?tab=readme-ov-file#configuration
       */
      scalar?: ScalarConfiguration;

      /**
       * Options for configuring Swagger UI if ` is set to `swagger-ui`
       * See https://swagger.io/specification/v2/
       */
      swagger?: Omit<
        Partial<SwaggerUIOptions>,
        | "dom_id"
        | "dom_node"
        | "spec"
        | "url"
        | "urls"
        | "layout"
        | "pluginsOptions"
        | "plugins"
        | "presets"
        | "onComplete"
        | "requestInterceptor"
        | "responseInterceptor"
        | "modelPropertyMacro"
        | "parameterMacro"
      >;

      endpoints?: {
        /**
         * Endpoint that serves the OpenAPI UI
         *
         * @default /docs
         */
        ui?: string;

        /**
         * Endpoint that serves the OpenAPI spec file
         *
         * @default /openapi
         */
        spec?: string;
      };

      /**
       * Paths to exclude from the OpenAPI documentation
       */
      exclude?: Array<string | RegExp>;

      /**
       * OpenAPI documentation
       */
      documentation?: Omit<OpenAPIObject, "openapi">;
    };
  }
}

/**
 * Extend the Route interface to include the `detail` macro
 */
declare module "@adonisjs/core/http" {
  export interface Route {
    openapi: (detail: OperationObject) => this;
  }

  export interface RouteResource<
    ActionNames extends ResourceActionNames = ResourceActionNames,
  > {
    openapi: (options: RouteResourceOpenApiOptions<ActionNames>) => this;
  }

  export interface RouteGroup {
    openapi: (detail: OperationObject) => this;
  }
}

export default class OpenApiProvider {
  #cachedSpec: string | null = null;

  constructor(protected app: ApplicationService) {}

  register() {
    registerRouteMacros(metaStore);
  }

  /**
   * Register /openapi route
   *
   * - In development, the OpenAPI spec is generated on the fly
   * - In production, the OpenAPI spec is read from the disk
   */
  async #registerOpenApiRoute(config: TuyauConfig, router: Router) {
    const tsConfigFilePath = join(
      fileURLToPath(this.app.appRoot),
      "./tsconfig.json"
    );

    const openApiPath = config.openapi?.endpoints?.spec ?? "/openapi";
    router.get(openApiPath, async () => {
      if (this.app.inDev) {
        const { OpenApiGenerator } = await import("../src/generator.js");
        return new OpenApiGenerator(
          config,
          metaStore,
          tsConfigFilePath
        ).generate();
      }

      if (this.#cachedSpec) return this.#cachedSpec;

      const buildPath = this.app.makePath(
        config.openapi?.buildSpecPath ?? ".adonisjs/openapi.json"
      );
      this.#cachedSpec = await readFile(buildPath, "utf-8");
      return this.#cachedSpec;
    });
  }

  /**
   * Register /docs route. The OpenAPI UI rendered using scalar or swagger-ui
   */
  #registerDocsRoute(config: TuyauConfig, router: Router) {
    const uiPath = config.openapi?.endpoints?.ui ?? "/docs";
    router.get(uiPath, async ({}) => {
      if (config.openapi?.provider === "scalar" || !config.openapi?.provider) {
        return scalarRenderer("/openapi", config.openapi?.scalar || {});
      }

      return swaggerUiRenderer("/openapi", config.openapi.swagger || {});
    });
  }

  /**
   * Register /docs and /openapi routes
   */
  async boot() {
    const config = this.app.config.get<TuyauConfig>("openapi");
    const router = await this.app.container.make("router");

    this.#registerOpenApiRoute(config, router);
    this.#registerDocsRoute(config, router);
  }

  /**
   * Compute meta store paths
   */
  async ready() {
    metaStore.compute();
  }
}
