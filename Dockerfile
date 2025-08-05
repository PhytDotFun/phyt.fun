FROM node:22-alpine AS base
RUN apk add --no-cache bash curl python3 make g++ git
RUN corepack enable && npm i -g turbo
WORKDIR /usr/src/app

FROM base AS pruner
WORKDIR /usr/src/app
COPY . .
RUN turbo prune --scope=@phyt/hono-gateway --scope=@phyt/workers --docker

FROM base AS builder
WORKDIR /usr/src/app
COPY --from=pruner /usr/src/app/out/json/ .
COPY --from=pruner /usr/src/app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN corepack prepare pnpm@10.14.0 --activate
RUN pnpm install --frozen-lockfile
COPY --from=pruner /usr/src/app/out/full/ .
COPY turbo.json turbo.json
RUN pnpm turbo run build --filter=@phyt/hono-gateway... --filter=@phyt/workers...

FROM base AS hono-gateway-prod
WORKDIR /usr/src/app
RUN corepack prepare pnpm@10.14.0 --activate
COPY --from=pruner /usr/src/app/out/json/ .
COPY --from=pruner /usr/src/app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --prod --frozen-lockfile
COPY --from=builder /usr/src/app/apps/hono-gateway/dist ./apps/hono-gateway/dist
COPY --from=builder /usr/src/app/packages ./packages
USER node
CMD ["pnpm", "--filter", "@phyt/hono-gateway", "start"]

FROM base AS workers-prod
WORKDIR /usr/src/app
RUN corepack prepare pnpm@10.14.0 --activate
COPY --from=pruner /usr/src/app/out/json/ .
COPY --from=pruner /usr/src/app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --prod --frozen-lockfile
COPY --from=builder /usr/src/app/apps/workers/dist ./apps/workers/dist
COPY --from=builder /usr/src/app/packages ./packages
USER node
CMD ["pnpm", "--filter", "@phyt/workers", "start"]

FROM base AS development
WORKDIR /usr/src/app
COPY --from=pruner /usr/src/app/out/json/ .
COPY --from=pruner /usr/src/app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY turbo.json turbo.json
COPY package.json .
RUN corepack prepare pnpm@10.14.0 --activate
RUN pnpm install --frozen-lockfile
COPY tooling/ops/docker-entrypoint.dev.sh /usr/local/bin/docker-entrypoint.dev.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.dev.sh
RUN chown -R node:node /usr/src/app
USER node