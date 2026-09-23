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
  | Sentry error monitoring (optional; disabled when unset)
  |----------------------------------------------------------
  */
  SENTRY_DSN: Env.schema.string.optional(),
  // Sentry environment tag, e.g. "staging". Defaults to NODE_ENV (read
  // directly by instrument.ts, which loads before this file).
  SENTRY_ENVIRONMENT: Env.schema.string.optional(),

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

  /*
  |----------------------------------------------------------
  | Optional namespace for every Redis key and pub/sub
  | channel (e.g. "staging:"). Staging shares prod's Redis
  | and its DB is a copy of prod, so user ids collide; the
  | prefix keeps sessions, limiter, cache and realtime
  | channels apart. Unset means no prefix (prod).
  |----------------------------------------------------------
  */
  REDIS_KEY_PREFIX: Env.schema.string.optional(),

  SESSION_DRIVER: Env.schema.enum(["cookie", "redis", "memory"] as const),

  /*
  |----------------------------------------------------------
  | Optional auth cookie overrides. Staging shares the
  | .studio2stadium.com cookie domain with prod, so it sets
  | its own cookie names; otherwise prod reads staging's
  | cookies and the other way round. Defaults:
  | COOKIE_DOMAIN ".studio2stadium.com" (production only),
  | SESSION_COOKIE_NAME "auth_session",
  | CACHE_COOKIE_NAME "auth_cache".
  |----------------------------------------------------------
  */
  COOKIE_DOMAIN: Env.schema.string.optional(),
  SESSION_COOKIE_NAME: Env.schema.string.optional(),
  CACHE_COOKIE_NAME: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Optional, comma-separated exact origins that CORS allows
  | on every route in production, in addition to the prod
  | api. and app. hostnames (config/cors.ts). Staging sets
  | its own hostnames here. Unset allows only prod's.
  |----------------------------------------------------------
  */
  CORS_ORIGINS: Env.schema.string.optional(),

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

  /*
  |----------------------------------------------------------
  | Optional outgoing-mail allowlist: comma-separated exact
  | emails and/or "@domain.com" patterns. When set, mail to
  | any other recipient is dropped and logged (staging runs
  | on a copy of prod data). Unset sends to everyone.
  |----------------------------------------------------------
  */
  MAIL_ALLOWLIST: Env.schema.string.optional(),

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
