/*
|--------------------------------------------------------------------------
| Environment variables service
|--------------------------------------------------------------------------
|
| The `Env.create` method creates an instance of the Env service. The
| service validates the environment variables and also cast values
| to JavaScript data types.
|
*/

import { Env } from "@adonisjs/core/env";

export default await Env.create(new URL("../", import.meta.url), {
  PORT: Env.schema.number(),
  APP_KEY: Env.schema.string(),
  HOST: Env.schema.string({ format: "host" }),
  LOG_LEVEL: Env.schema.enum([
    "fatal",
    "error",
    "warn",
    "info",
    "debug",
    "trace",
    "silent",
  ]),
  SITE_URL: Env.schema.string(),

  HEALTH_SECRET: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for configuring database connection
  |----------------------------------------------------------
  */
  DATABASE_URL: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for configuring session package
  |----------------------------------------------------------
  */
  REDIS_HOST: Env.schema.string({ format: "host" }),
  REDIS_PORT: Env.schema.number(),
  REDIS_USERNAME: Env.schema.string.optionalWhen(
    process.env.NODE_ENV !== "production"
  ),
  REDIS_PASSWORD: Env.schema.string.optionalWhen(
    process.env.NODE_ENV !== "production"
  ),

  SESSION_DRIVER: Env.schema.enum(["cookie", "redis", "memory"] as const),

  /*
  |----------------------------------------------------------
  | Variables for configuring the limiter package
  |----------------------------------------------------------
  */
  LIMITER_STORE: Env.schema.enum(["redis", "memory"] as const),

  /*
  |----------------------------------------------------------
  | Variables for configuring the mail package
  |----------------------------------------------------------
  */
  AWS_ACCESS_KEY_ID: Env.schema.string(),
  AWS_SECRET_ACCESS_KEY: Env.schema.string(),
  AWS_REGION: Env.schema.string(),
  MAIL_FROM_ADDRESS: Env.schema.string({ format: "email" }),
  MAIL_FROM_NAME: Env.schema.string(),

  SQS_ACCESS_KEY_ID: Env.schema.string(),
  SQS_SECRET_ACCESS_KEY: Env.schema.string(),
  SQS_QUEUE_URL: Env.schema.string(),
  SQS_DEAD_LETTER_QUEUE_URL: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for configuring the drive package
  |----------------------------------------------------------
  */
  DRIVE_DISK: Env.schema.enum(["r2"] as const),
  R2_BUCKET: Env.schema.string(),
  R2_KEY: Env.schema.string(),
  R2_SECRET: Env.schema.string(),
  R2_ENDPOINT: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for Stripe integration
  |----------------------------------------------------------
  */
  STRIPE_API_KEY: Env.schema.string(),
  STRIPE_WEBHOOK_SECRET: Env.schema.string.optional(),
  STRIPE_PRICE_ID_MONTHLY: Env.schema.string(),
  STRIPE_PRICE_ID_YEARLY: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for Cloudflare Stream/Images integration
  |----------------------------------------------------------
  */
  CLOUDFLARE_API_TOKEN: Env.schema.string(),
  CLOUDFLARE_ACCOUNT_ID: Env.schema.string(),
  CLOUDFLARE_WEBHOOK_SECRET: Env.schema.string(),
  CLOUDFLARE_WEBHOOK_URL: Env.schema.string(),
  CLOUDFLARE_STREAM_TOKEN: Env.schema.string(),
  CLOUDFLARE_STREAM_URL: Env.schema.string(),
});
