import { defineConfig, drivers } from "@adonisjs/core/hash";

const hashConfig = defineConfig({
  default: "argon",

  list: {
    argon: drivers.argon2({
      parallelism: 1,
    }),
  },
});

export default hashConfig;

/**
 * Inferring types for the list of hashers you have configured
 * in your application.
 */
declare module "@adonisjs/core/types" {
  export interface HashersList extends InferHashers<typeof hashConfig> {}
}
