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

// Read when the schema is validated, after the .env files are loaded into
// process.env.
const usesLocalDisk = () =>
  process.env.DRIVE_DISK === "fs" && process.env.NODE_ENV !== "production";

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

  /*
  |----------------------------------------------------------
  | This backend's own public base URL. SITE_URL is the
  | frontend; links that must resolve to an API route
  | (unsubscribe) use this instead.
  |----------------------------------------------------------
  */
  API_URL: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | The S2S Live marketing site's public base URL. The buyer's
  | browser returns here after an Event Tier Checkout Session,
  | separate from SITE_URL (the product frontend).
  |----------------------------------------------------------
  */
  MARKETING_SITE_URL: Env.schema.string(),

  HEALTH_SECRET: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Scheduled email jobs (default off; must be explicitly
  | enabled in production after a verified dry run)
  |----------------------------------------------------------
  */
  CRON_EMAILS_ENABLED: Env.schema.boolean.optional(),

  /*
  |----------------------------------------------------------
  | Who gets the "new school application" email when a school
  | submits its application (defaults to
  | abbey@studio2stadium.com when unset)
  |----------------------------------------------------------
  */
  APPLICATION_ALERT_EMAIL: Env.schema.string.optional({ format: "email" }),

  /*
  |----------------------------------------------------------
  | Dev-only one-click sign-in link (GET /auth/dev-sign-in).
  | Set only by run-dev-server's private .env copy; ignored
  | unless NODE_ENV=development.
  |----------------------------------------------------------
  */
  DEV_SIGN_IN_LINK_ENABLED: Env.schema.boolean.optional(),

  /*
  |----------------------------------------------------------
  | Sentry error monitoring (optional; disabled when unset)
  |----------------------------------------------------------
  */
  SENTRY_DSN: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Set by Fly on each machine; routes Transmit requests to
  | the machine holding the SSE stream (unset outside Fly)
  |----------------------------------------------------------
  */
  FLY_MACHINE_ID: Env.schema.string.optional(),

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
  MAIL_TO_ADDRESS: Env.schema.string({ format: "email" }),
  MAIL_FROM_NAME: Env.schema.string(),

  SQS_ACCESS_KEY_ID: Env.schema.string(),
  SQS_SECRET_ACCESS_KEY: Env.schema.string(),
  SQS_QUEUE_URL: Env.schema.string(),
  SQS_DEAD_LETTER_QUEUE_URL: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for configuring the drive package.
  | "fs" writes files to apps/backend/storage for local
  | development and needs no R2 variables. Production must
  | use "r2": "fs" fails validation there.
  |----------------------------------------------------------
  */
  DRIVE_DISK: (key: string, value?: string) => {
    const disk = Env.schema.enum(["r2", "fs"] as const)(key, value);
    if (disk === "fs" && process.env.NODE_ENV === "production") {
      throw new Error(`${key}=fs cannot be used in production; set it to r2`);
    }
    return disk;
  },
  R2_BUCKET: Env.schema.string.optionalWhen(usesLocalDisk),
  R2_KEY: Env.schema.string.optionalWhen(usesLocalDisk),
  R2_SECRET: Env.schema.string.optionalWhen(usesLocalDisk),
  R2_ENDPOINT: Env.schema.string.optionalWhen(usesLocalDisk),

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
  | One Stripe one-time Price per self-serve Event Tier (see
  | #shared/org/event-tiers). Enterprise has no fixed price and
  | stays a sales conversation, so it has none here.
  |----------------------------------------------------------
  */
  STRIPE_PRICE_ID_EVENT_TIER_CORE: Env.schema.string(),
  STRIPE_PRICE_ID_EVENT_TIER_REGIONAL: Env.schema.string(),
  STRIPE_PRICE_ID_EVENT_TIER_NATIONAL: Env.schema.string(),

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
  CLOUDFLARE_DEPLOY_HOOK: Env.schema.string(),
});
