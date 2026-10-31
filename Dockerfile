# Pinned to 24.22.1, the Node.js security release on the 24 line. Since 24.20, Node
# rejects path-relative URLs against an opaque base, as the WHATWG URL spec requires.
# jsonschema@1.5.0 (via @adonisjs/ace) resolves $refs with
# `new URL(ref, 'thismessage::/')`, so `adonis-kit index` threw "Invalid URL" and
# packages/openapi/build/commands/main.js was never generated.
# patches/jsonschema@1.5.0.patch switches that base to `thismessage:/`; drop the
# patch once jsonschema ships a fix.
FROM node:24.22.1-slim AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install dependencies
FROM base AS deps
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/openapi ./packages/openapi/
COPY packages/emails ./packages/emails/
COPY patches ./patches/

RUN pnpm install --frozen-lockfile

# Build
FROM deps AS build
COPY apps/backend ./apps/backend

RUN pnpm --filter @stos/openapi build
# adonis-kit index swallows its own errors and exits 0, so verify the generated
# command index exists before the backend build imports it.
RUN test -f packages/openapi/build/commands/main.js
RUN pnpm --filter @stos/emails build
RUN pnpm --filter backend build

RUN pnpm deploy --filter backend --prod /app/deployed

# Production
FROM base AS production
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0
COPY --from=build /app/deployed/node_modules ./node_modules
COPY --from=build /app/deployed/build .
COPY apps/backend/openapi.json ./.adonisjs/openapi.json
EXPOSE 8080
CMD ["node", "bin/server.js"]
