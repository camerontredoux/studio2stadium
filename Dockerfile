FROM node:24-slim AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install dependencies
FROM base AS deps
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/openapi ./packages/openapi/

RUN pnpm install --frozen-lockfile

# Build
FROM deps AS build
COPY apps/backend ./apps/backend

RUN pnpm --filter @stos/openapi build
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
