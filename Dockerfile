ARG NODE_VERSION=22
ARG NODE_ENV=production

FROM node:${NODE_VERSION}-alpine AS alpine

RUN apk update
RUN apk add --no-cache gcompat

FROM alpine AS base
ENV CI=true
RUN npm install pnpm turbo --global
RUN pnpm config set store-dir ~/.pnpm-store

FROM base AS pruner
ARG PROJECT

WORKDIR /app
COPY . .
RUN turbo prune --scope=@phyt/${PROJECT} --docker

FROM base AS builder
ARG PROJECT

WORKDIR /app

COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=pruner /app/out/json/ .

RUN --mount=type=cache,id=pnpm,target=~/.pnpm-store pnpm install --frozen-lockfile

COPY --from=pruner /app/out/full/ .

COPY --from=pruner /app/tooling/tsconfig ./tooling/tsconfig

RUN turbo build --filter=@phyt/${PROJECT}
RUN --mount=type=cache,id=pnpm,target=~/.pnpm-store pnpm prune --prod --no-optional --ignore-scripts
RUN rm -rf ./**/*/src

FROM alpine AS runner
ARG PROJECT
ARG BUILD_TIMESTAMP

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs
USER nodejs

WORKDIR /app
COPY --from=builder --chown=nodejs:nodejs /app .
WORKDIR /app/apps/${PROJECT}

ARG PORT=8080
EXPOSE ${PORT}

ENV PORT=${PORT}
ENV BUILD_TIMESTAMP=${BUILD_TIMESTAMP}

CMD ["node", "dist/index.js"]
