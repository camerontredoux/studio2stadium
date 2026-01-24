import type { TuyauConfig } from "@tuyau/core/types";
import { defu } from "defu";
import {
  OpenAPIObject,
  ParameterObject,
  RequestBodyObject,
  ResponseObject,
  SchemaObject,
  SchemaObjectType,
} from "openapi3-ts/oas31";
import type tsMorph from "ts-morph";
import { Node } from "ts-morph";

import { typeFootprint } from "./footprint.js";
import type { MetaStore } from "./meta_store.js";

const $methods = [
  "$get",
  "$head",
  "$post",
  "$put",
  "$patch",
  "$delete",
] as const;

type Methods = (typeof $methods)[number];

export class OpenApiGenerator {
  constructor(
    private config: TuyauConfig,
    private metaStore: MetaStore,
    private tsConfigFilePath: string
  ) {}

  /**
   * Get the OpenAPI type string for a primitive type
   */
  #typeToString(type: tsMorph.Type<tsMorph.ts.Type>): string {
    if (type.getText() === "true" || type.getText() === "false")
      return "boolean";
    if (type.isString()) return "string";
    if (type.isNumber()) return "number";
    if (type.isBoolean()) return "boolean";
    if (type.isLiteral()) return "string";
    if (type.isBooleanLiteral()) return "boolean";
    if (type.isNull()) return "null";
    if (type.isArray()) return "array";
    return "object";
  }

  /**
   * Check if the type is a primitive type
   */
  #isPrimitive(type: tsMorph.Type<tsMorph.ts.Type>) {
    return (
      type.isString() ||
      type.isNumber() ||
      type.isBoolean() ||
      type.isEnum() ||
      type.isLiteral() ||
      type.isUndefined() ||
      type.isNull() ||
      type.isBooleanLiteral()
    );
  }

  /**
   * Convert a type to a complete OpenAPI schema object
   */
  #typeToSchemaObject(
    type: tsMorph.Type<tsMorph.ts.Type>,
    mode: "request" | "response"
  ): SchemaObject {
    if (type.isArray()) {
      const elementType = type.getArrayElementTypeOrThrow();
      return {
        type: "array",
        items: this.#typeToSchemaObject(elementType, mode),
      };
    }

    if (type.isUnion()) {
      const unionTypes = type.getUnionTypes();
      const nonNullableTypes = unionTypes.filter(
        (t) => !t.isNull() && !t.isUndefined()
      );
      const isNullable = unionTypes.some((t) => t.isNull());

      if (nonNullableTypes.every((t) => t.isStringLiteral())) {
        const enumValues = nonNullableTypes.map(
          (t) => t.getLiteralValue() as string
        );

        const schema: SchemaObject = { type: "string", enum: enumValues };

        if (isNullable) {
          return { oneOf: [schema, { type: "null" }] };
        }

        return schema;
      }

      if (nonNullableTypes.every(this.#isPrimitive)) {
        const uniqueTypes = [
          ...new Set(nonNullableTypes.map((t) => this.#typeToString(t))),
        ];

        const schema: SchemaObject =
          uniqueTypes.length === 1
            ? { type: uniqueTypes[0] as SchemaObjectType }
            : { type: uniqueTypes as SchemaObjectType[] };

        if (isNullable) {
          return { oneOf: [schema, { type: "null" }] };
        }

        return schema;
      }

      if (nonNullableTypes.length === 1) {
        const schema = this.#typeToSchemaObject(nonNullableTypes[0], mode);

        if (isNullable) {
          return { oneOf: [schema, { type: "null" }] };
        }

        return schema;
      }

      const schemas = nonNullableTypes.map((t) =>
        this.#typeToSchemaObject(t, mode)
      );

      if (isNullable) {
        schemas.push({ type: "null" });
      }

      return { oneOf: schemas };
    }

    if (this.#isPrimitive(type)) {
      return { type: this.#typeToString(type) as SchemaObjectType };
    }

    const properties = this.#getTypesProperties(type, mode);
    const required = this.#getRequiredProperties(type);
    return {
      type: "object",
      properties,
      ...(required.length && mode === "request" && { required }),
    };
  }

  /**
   * Convert an object type to OpenAPI properties
   */
  #getTypesProperties(
    type: tsMorph.Type<tsMorph.ts.Type>,
    mode: "request" | "response"
  ): Record<string, SchemaObject> {
    const properties: Record<string, SchemaObject> = {};

    for (const prop of type.getProperties()) {
      const propName = prop.getName();
      const propSignature = prop.getValueDeclaration();

      if (!Node.isPropertySignature(propSignature)) continue;

      const propType = propSignature.getType();

      properties[propName] = this.#typeToSchemaObject(propType, mode);
    }

    return properties;
  }

  /**
   * Get required property names from an object type
   */
  #getRequiredProperties(type: tsMorph.Type<tsMorph.ts.Type>): string[] {
    const required: string[] = [];

    for (const prop of type.getProperties()) {
      const propSignature = prop.getValueDeclaration();

      if (!Node.isPropertySignature(propSignature)) continue;

      if (!prop.isOptional()) {
        required.push(prop.getName());
      }
    }

    return required;
  }

  #openApiSchemaObject(options: {
    type: tsMorph.Type<tsMorph.ts.Type>;
    mode: "request" | "response";
  }): SchemaObject {
    const { type, mode } = options;

    if (type.isObject() && !type.isArray()) {
      const properties = this.#getTypesProperties(type, mode);
      const required = this.#getRequiredProperties(type);

      return {
        type: "object",
        properties,
        ...(required.length && mode === "request" && { required }),
      };
    }

    return this.#typeToSchemaObject(type, mode);
  }

  /**
   * Simply wraps a schema object in a request body object
   */
  #schemaObjectToRequestBody(
    request: SchemaObject
  ): RequestBodyObject | undefined {
    if (!request.properties || Object.keys(request.properties).length === 0) {
      return undefined;
    }

    return {
      content: {
        "application/json": {
          schema: request,
        },
      },
    };
  }

  /**
   * Converts a schema object to request query parameters
   *
   * For example, a schema like:
   * ```
   * {
   *   type: 'object',
   *   properties: {
   *     search: { type: 'string' },
   *     limit: { type: 'number' }
   *   },
   *   required: ['search']
   * }
   * ```
   *
   * Will be converted to:
   * ```
   * [
   *   { name: 'search', in: 'query', required: true, schema: { type: 'string' } },
   *   { name: 'limit', in: 'query', required: false, schema: { type: 'number' } }
   * ]
   * ```
   */
  #schemaObjectToQueryParameters(request: SchemaObject): ParameterObject[] {
    if (!request.properties) {
      return [];
    }

    /**
     * VineJS validates route (path) params inside a `params` property, so we need to
     * destructure that and get the query param properties. Path params are already handled.
     */
    const { params, ...rest } = request.properties;
    return Object.entries(rest).map(([name, schema]) => ({
      name,
      in: "query",
      required: request.required?.includes(name) ?? false,
      schema,
    }));
  }

  #isApiErrorResponse(status: string) {
    const statusCode = Number.parseInt(status, 10);
    if (Number.isNaN(statusCode)) {
      return true;
    }
    return statusCode < 200 || (statusCode >= 300 && statusCode < 500);
  }

  /**
   * Convert status code to a default response description
   */
  #statusToResponseDescription(status: string) {
    const statusCode = Number.parseInt(status, 10);
    if (Number.isNaN(statusCode)) {
      return "Error Response";
    }
    switch (statusCode) {
      case 200:
        return "OK";
      case 201:
        return "Created";
      case 204:
        return "No Content";
      case 400:
        return "Bad Request";
      case 401:
        return "Unauthorized";
      case 403:
        return "Forbidden";
      case 404:
        return "Not Found";
      case 422:
        return "Unprocessable Entity";
      case 429:
        return "Too Many Requests";
      case 503:
        return "Service Unavailable";
      default:
        return "Unknown Response";
    }
  }

  /**
   * Extract the OpenAPI schema object for a request or response from the footprint.
   *
   * For a footprint like:
   * ```
   * {
   *   request: {
   *     name: string;
   *     age?: number;
   *   }
   * }
   * ```
   * This method will return:
   * ```
   * {
   *   type: 'object',
   *   properties: {
   *     name: { type: 'string' },
   *     age: { type: 'number' }
   *   },
   *   required: ['name']
   * }
   * ```
   */
  #getSchemaObjectFor(
    mode: "request" | "response",
    symbol: tsMorph.Type<tsMorph.ts.Type>
  ) {
    const type = symbol
      .getPropertyOrThrow(mode)
      .getValueDeclarationOrThrow()
      .getType();

    const schemaObject = this.#openApiSchemaObject({
      type,
      mode,
    });

    return schemaObject;
  }

  #generateRequestBody(
    options: {
      method: Methods;
      methodType: tsMorph.Type<tsMorph.ts.Type>;
    },
    openApiParameters: ParameterObject[]
  ) {
    const request = this.#getSchemaObjectFor("request", options.methodType);

    const methods: Methods[] = ["$post", "$put", "$patch"];
    const spec: {
      parameters?: ParameterObject[];
      requestBody?: RequestBodyObject;
    } = {};

    if (methods.includes(options.method)) {
      spec.requestBody = this.#schemaObjectToRequestBody(request);
      if (openApiParameters.length) {
        spec.parameters = openApiParameters;
      }
      return spec;
    }

    const queryParameters = this.#schemaObjectToQueryParameters(request);
    spec.parameters = [...openApiParameters, ...queryParameters];
    return spec;
  }

  /**
   * Generate the responses object for the OpenAPI spec
   *
   * Given a footprint like:
   * ```
   * {
   *   response: {
   *     200: {
   *       name: string;
   *       age?: number;
   *     };
   *     404: {
   *       message: string;
   *     };
   *   }
   * }
   * ```
   * This method will return:
   * ```
   * {
   *   responses: {
   *     '200': {
   *       description: 'Successful Response',
   *       content: {
   *         'application/json': {
   *           schema: {
   *             type: 'object',
   *             properties: {
   *               name: { type: 'string' },
   *               age: { type: 'number' }
   *             }
   *           }
   *         }
   *       }
   *     },
   *     '404': {
   *       description: 'Error Response',
   *       content: {
   *         'application/json': {
   *           schema: {
   *             type: 'object',
   *             properties: {
   *               message: { type: 'string' }
   *             }
   *           }
   *         }
   *       }
   *     }
   *   }
   * }
   * ```
   */
  #generateResponses(methodType: tsMorph.Type<tsMorph.ts.Type>) {
    const response = this.#getSchemaObjectFor("response", methodType);

    const responses: Record<string, ResponseObject> = {};
    if (response.properties) {
      for (const [status, schema] of Object.entries(response.properties)) {
        if (this.#isApiErrorResponse(status)) {
          responses[status] = {
            description: this.#statusToResponseDescription(status),
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiErrorResponse" },
              },
            },
          };
          continue;
        }
        const { required, ...rest } = schema as SchemaObject;
        responses[status] = {
          description: this.#statusToResponseDescription(status),
          content: { "application/json": { schema: rest } },
        };
      }
    } else {
      responses["200"] = {
        description: "Successful Response",
        content: { "application/json": { schema: response } },
      };
    }

    return { responses };
  }

  /**
   * Given a path like `/users/:id`, it returns:
   * - openApiPath: `/users/{id}`
   * - and parameters to be passed to the OpenAPI spec
   */
  #pathToOpenApiPathAndParameters(path: string) {
    const parameters = path.match(/:(\w+)/g) || [];
    const openApiPath = path.replace(/:(\w+)/g, "{$1}");

    const openApiParameters: ParameterObject[] = parameters.map((param) => ({
      name: param.replace(":", ""),
      in: "path",
      required: true,
      schema: { type: "string" },
    }));

    return { openApiPath, openApiParameters };
  }

  #generateEndpointSpec(options: {
    path: string;
    method: Methods;
    methodType: tsMorph.Type<tsMorph.ts.Type>;
  }) {
    const { path, methodType } = options;
    const { openApiPath, openApiParameters } =
      this.#pathToOpenApiPathAndParameters(path);

    const defaultSpec = {
      ...this.#generateRequestBody(options, openApiParameters),
      ...this.#generateResponses(methodType),
    };

    const method = options.method.replace("$", "");
    const computedSpec = this.metaStore.getComputed({ method, path });

    return {
      method,
      path: openApiPath,
      spec: defu(computedSpec, defaultSpec),
    };
  }

  /**
   * Check if the given path is excluded. Excluded path are defined
   * inside the config/tuyau.ts file
   */
  #isPathExcluded(path: string) {
    for (const ignoreRoute of this.config.openapi?.exclude || []) {
      if (typeof ignoreRoute === "string" && ignoreRoute === path) {
        return true;
      }

      if (ignoreRoute instanceof RegExp && ignoreRoute.test(path)) {
        return true;
      }
    }

    return false;
  }

  #generateApiDoc(options: {
    endpointPrefix?: string;
    definition: tsMorph.InterfaceDeclaration;
    openApiDoc: OpenAPIObject;
  }) {
    const { endpointPrefix = "", definition, openApiDoc } = options;

    // Loop over all properties of footprint and look for endpoints definitions
    for (const prop of definition.getProperties()) {
      const endpointName = prop.getName().replace(/'/g, "");
      const path = `${endpointPrefix}/${endpointName}`;

      const propType = prop.getType();
      // Properties are $url and ${method} if it's endpoint, else it's nested
      const properties = propType.getProperties();

      /**
       * If the property is an endpoint definition, then check for
       * every method existence and generate the openapi spec for it
       */
      const isEndpoint =
        propType.isObject() && properties.some((p) => p.getName() === "$url");
      if (isEndpoint) {
        for (const method of $methods) {
          if (this.#isPathExcluded(path)) continue;
          if (method === "$head") continue;

          const methodSymbol = propType.getProperty(method);
          if (!methodSymbol) continue;

          const methodSignature = methodSymbol.getValueDeclaration();
          if (!Node.isPropertySignature(methodSignature)) continue;

          const doc = this.#generateEndpointSpec({
            path,
            method,
            methodType: methodSignature.getType(),
          });

          openApiDoc.paths = openApiDoc.paths || {};
          openApiDoc.paths[doc.path] = openApiDoc.paths[doc.path] || {};
          // @ts-expect-error tkt
          openApiDoc.paths[doc.path][doc.method] = doc.spec;
        }
      }

      // Recursively generate spec for nested properties of footprint
      const hasNestedElements = properties.some((p) => p.getName() !== "$url");
      if (hasNestedElements && !$methods.includes(endpointName as any)) {
        this.#generateApiDoc({
          definition: propType
            .getSymbolOrThrow()
            .getDeclarations()[0] as tsMorph.InterfaceDeclaration,
          endpointPrefix: path,
          openApiDoc,
        });
      }
    }
  }

  /**
   * Generate the openapi documentation from the typescript api definition
   */
  async generate() {
    const { Project, QuoteKind } = await import("ts-morph");

    const project = new Project({
      manipulationSettings: { quoteKind: QuoteKind.Single },
      tsConfigFilePath: this.tsConfigFilePath,
    });

    const footprint = typeFootprint(".adonisjs/api.ts", "ApiDefinition", {
      tsConfigFilePath: this.tsConfigFilePath,
    });

    const footprintFile = project.createSourceFile(
      ".adonisjs/__footprint.ts",
      footprint,
      {
        overwrite: true,
      }
    );

    const definition = footprintFile.getInterfaceOrThrow("ApiDefinition");

    const openApiDoc: OpenAPIObject = defu(this.config.openapi?.documentation, {
      openapi: "3.1.0",
      info: {
        title: "API Documentation",
        version: "1.0.0",
      },
      servers: [{ url: "http://localhost:3333" }],
      paths: {},
    });

    this.#generateApiDoc({ definition, openApiDoc });

    return JSON.stringify(openApiDoc, null, 2);
  }
}
