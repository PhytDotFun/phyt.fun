FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/*/package.json ./packages/
COPY apps/*/package.json      ./apps/        

RUN pnpm install --frozen-lockfile --prod --ignore-scripts

# ── runtime image ───────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nodejs
RUN corepack enable pnpm

# copy only what’s needed at runtime
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages      ./packages
COPY --from=deps /app/apps          ./apps       

USER nodejs

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "console.log('worker ok')" || exit 1

CMD ["node", "apps/workers/dist/index.js"]
