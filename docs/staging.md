# Staging

Staging is a copy of the backend that runs on a copy of prod data. Use it to
test changes before they go to `main`.

## Setup

| Part | Staging | Notes |
| --- | --- | --- |
| API | Fly app `studio2stadium-staging` (org `abbey-nugent`, region `iad`), config `fly.staging.toml` | One shared-cpu-1x/512mb machine. It stops when idle and starts on the next request, so the first request can be slow. |
| Database | Supabase staging project | A copy of prod. Migrations run on each deploy (`release_command`). |
| Redis | Prod's Upstash Redis, shared | `REDIS_KEY_PREFIX=staging:` namespaces all keys and pub/sub channels. See below. |
| Events | SQS queues `events-staging` and `events-staging-dlq` | No consumer. The outbox cron publishes to them and the messages stay there. |
| Storage | R2 bucket `s2s-staging` | |
| Payments | Stripe test mode | Test keys, test price ids, and a test-mode webhook endpoint. |
| Frontend | Cloudflare Pages branch preview: https://staging.studio2stadium.pages.dev | |
| Marketing | Cloudflare Pages branch preview: https://staging.marketing-1uy.pages.dev | |
| Errors | Same Sentry project as prod | Events have environment `staging` (`SENTRY_ENVIRONMENT`). |

### Safety settings

`fly.staging.toml` `[env]` sets these values. Fly secrets override `[env]`, so
do not set any of these as a secret with a prod value.

- `REDIS_KEY_PREFIX=staging:` puts every key under `staging:`. This covers
  sessions (`staging:session:*`), session versions, password reset tokens,
  rate limits, and the cache. It also prefixes the realtime channels
  (`staging:realtime:user:*`) and the cache bus namespace. Staging user ids are
  the same as prod's, so without the prefix staging could read and overwrite
  prod sessions.
- `MAIL_ALLOWLIST=@studio2stadium.com` drops mail to all other recipients and
  logs each dropped recipient at info level. The value is a comma-separated
  list of exact addresses and `@domain` patterns. To receive mail at a test
  inbox, add the inbox to this value in `fly.staging.toml`.
- `CRON_EMAILS_ENABLED=false` stops the prospect reminder and digest jobs.
- `SENTRY_ENVIRONMENT=staging`.

Cron jobs run in the web process (`start/cron.ts`). They run only while a
machine is up.

## Deploy

Merge or push into the `staging` branch. `.github/workflows/deploy-staging.yml`
runs `flyctl deploy --remote-only --config fly.staging.toml`. You can also run
the workflow by hand from the Actions tab (workflow_dispatch).

The workflow uses the repository secret `FLY_STAGING_API_TOKEN`. Use a deploy
token for the staging app only:

```bash
fly tokens create deploy -a studio2stadium-staging
```

## Secrets

Set secrets with `fly secrets set NAME=value -a studio2stadium-staging`. The
names come from `apps/backend/start/env.ts`.

### Must differ from prod

| Secret | Staging value / reason |
| --- | --- |
| `DATABASE_URL` | Supabase staging project. Prod's value would run migrations and writes on the prod DB. |
| `APP_KEY` | New random key. It signs cookies, and a shared key would make staging-signed cookies valid on prod. |
| `HEALTH_SECRET` | New value, so a staging leak does not expose prod's detailed health report. |
| `SITE_URL` | `https://staging.studio2stadium.pages.dev`. Links in mail and redirects must go to the staging frontend. |
| `API_URL` | `https://studio2stadium-staging.fly.dev` (unsubscribe and other API links). |
| `MARKETING_SITE_URL` | `https://staging.marketing-1uy.pages.dev` (Event Tier Checkout return URL). The backend has no marketing origins variable. See "Known gaps". |
| `STRIPE_API_KEY` | Test-mode secret key (`sk_test_...`). A live key would take real money. |
| `STRIPE_WEBHOOK_SECRET` | Signing secret of a test-mode endpoint at `https://studio2stadium-staging.fly.dev/stripe/webhook`. |
| `STRIPE_PRICE_ID_MONTHLY`, `STRIPE_PRICE_ID_YEARLY`, `STRIPE_PRICE_ID_EVENT_TIER_CORE`, `STRIPE_PRICE_ID_EVENT_TIER_REGIONAL`, `STRIPE_PRICE_ID_EVENT_TIER_NATIONAL` | Test-mode price ids. Live price ids do not exist in test mode. |
| `SQS_QUEUE_URL`, `SQS_DEAD_LETTER_QUEUE_URL` | `events-staging` and `events-staging-dlq`. Prod's queues would make the prod consumer process staging events. |
| `SQS_ACCESS_KEY_ID`, `SQS_SECRET_ACCESS_KEY` | Preferably an IAM user that can use only the staging queues. |
| `R2_BUCKET` | `s2s-staging`. Prod's bucket would let staging delete or overwrite prod files. |
| `CLOUDFLARE_WEBHOOK_URL` | `https://studio2stadium-staging.fly.dev/cloudflare/stream/webhook`. See "Known gaps". |
| `CLOUDFLARE_DEPLOY_HOOK` | Deploy hook for the `staging` branch of the marketing Pages project. Prod's hook would rebuild the live marketing site when a staging admin changes a blog post. |
| `MAIL_TO_ADDRESS` | An allowlisted inbox. Contact and feedback mail goes here, and the allowlist drops any other address. |

These are in `[env]` and must not be set as secrets with prod values:
`REDIS_KEY_PREFIX`, `MAIL_ALLOWLIST`, `CRON_EMAILS_ENABLED`,
`SENTRY_ENVIRONMENT`.

### Can match prod

| Secret | Notes |
| --- | --- |
| `REDIS_HOST`, `REDIS_PORT`, `REDIS_USERNAME`, `REDIS_PASSWORD` | Shared Upstash. `REDIS_KEY_PREFIX` keeps the data apart. |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` | SES. `MAIL_ALLOWLIST` limits the recipients. |
| `MAIL_FROM_ADDRESS`, `MAIL_FROM_NAME` | |
| `R2_KEY`, `R2_SECRET`, `R2_ENDPOINT` | A token limited to `s2s-staging` is safer. |
| `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_STREAM_TOKEN`, `CLOUDFLARE_STREAM_URL`, `CLOUDFLARE_WEBHOOK_SECRET` | Same Stream account as prod. See "Known gaps". |
| `SENTRY_DSN` | Same project. `SENTRY_ENVIRONMENT` separates the events. |

Set in `[env]`, no secret needed: `APP_NAME`, `HOST`, `PORT`, `TZ`,
`LOG_LEVEL`, `DRIVE_DISK`, `LIMITER_STORE`, `SESSION_DRIVER`.

## Known gaps

- CORS and cookies: in production, `config/cors.ts` allows only
  `api.studio2stadium.com` and `app.studio2stadium.com`. `config/auth.ts` and
  `config/app.ts` set the cookie domain to `.studio2stadium.com`. A frontend on
  `*.pages.dev` that calls `*.fly.dev` is blocked by CORS and cannot keep a
  session cookie. Staging needs configurable origins and cookie domain, or
  custom `*.studio2stadium.com` staging hostnames with a different cookie name.
- Cloudflare Stream sends webhooks to one URL for each account. Staging uses
  prod's Stream account, so video-ready webhooks for staging uploads go to
  prod, and staging videos stay "processing". It also means
  `CLOUDFLARE_WEBHOOK_URL` has no effect.
- The `apps/events` consumer does not run for staging. Events stay in
  `events-staging`.
