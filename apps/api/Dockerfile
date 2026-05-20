FROM node:20-alpine AS base
# Chromium needed for Puppeteer (PDF generation)
RUN apk add --no-cache \
    openssl \
    libc6-compat \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# ---- deps: install all workspace deps (dev included for build) ----
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json turbo.json tsconfig.base.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/db/package.json ./packages/db/
COPY packages/types/package.json ./packages/types/
RUN npm ci

# ---- builder: compile packages + api ----
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY packages ./packages
COPY apps/api ./apps/api
COPY package.json package-lock.json turbo.json tsconfig.base.json ./

# Generate Prisma client, then build api and its local dependencies
RUN cd packages/db && npx prisma generate
RUN npx turbo run build --filter=api...

# ---- runner: minimal production image ----
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/db/package.json ./packages/db/
COPY packages/types/package.json ./packages/types/

# Copy Prisma schema before npm ci (used if prisma postinstall runs)
COPY --from=builder /app/packages/db/prisma ./packages/db/prisma

# Skip postinstall scripts so @prisma/client doesn't try to regenerate
RUN npm ci --omit=dev --ignore-scripts

# Copy pre-generated Prisma client from builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy compiled source
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages/db/dist ./packages/db/dist
COPY --from=builder /app/packages/types/dist ./packages/types/dist

EXPOSE 4000
CMD ["node", "apps/api/dist/main"]
