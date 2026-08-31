# Pinned to 24.19: Node 24.20 broke the WHATWG URL parsing that jsonschema@1.5.0
# (via @adonisjs/ace) relies on to resolve $refs, so `adonis-kit index` fails to
# generate packages/openapi/build/commands/main.js and the backend build cannot
# resolve it. Unpin once ace/jsonschema ship a fix.
FROM node:24.19-slim AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install dependencies
FROM base AS deps
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/openapi ./packages/openapi/
COPY packages/emails ./packages/emails/

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
