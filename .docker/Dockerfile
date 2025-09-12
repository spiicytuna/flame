FROM node:22-alpine AS builder

WORKDIR /app

# --- Server Deps
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm install --production --no-audit --no-fund

# --- Install+Build Deps
WORKDIR /app/client
COPY client/package.json ./package.json
# purposefully NOT copying package-lock.json

RUN --mount=type=cache,target=/root/.npm \
    npm install --no-audit --no-fund

# rollup native binary present ??
# Alpine => musl
#   _amd64  => @rollup/rollup-linux-x64-musl
#   _arm64  => @rollup/rollup-linux-arm64-musl
ARG TARGETARCH
RUN set -eux; \
  PKG_NAME=''; PKG_DIR=''; \
  if [ "${TARGETARCH:-}" = "arm64" ]; then \
    PKG_NAME='@rollup/rollup-linux-arm64-musl'; \
    PKG_DIR='node_modules/@rollup/rollup-linux-arm64-musl'; \
  elif [ "${TARGETARCH:-}" = "amd64" ]; then \
    PKG_NAME='@rollup/rollup-linux-x64-musl'; \
    PKG_DIR='node_modules/@rollup/rollup-linux-x64-musl'; \
  fi; \
  if [ -n "$PKG_NAME" ] && [ ! -f "$PKG_DIR/package.json" ]; then \
    npm i -D "$PKG_NAME" --no-audit --no-fund; \
  fi

# --- Build Client
COPY client/ ./
RUN npm run build

# --- Final Files
WORKDIR /app
COPY . .
RUN mkdir -p ./public && mv ./client/dist/* ./public
# Clean up the client source code
RUN rm -rf ./client

# ---- Final Stage
FROM node:22-alpine

WORKDIR /app

# Copy app from build
COPY --from=builder /app /app

# runtime OS deps
RUN apk add --no-cache curl jq sqlite

ENV NODE_ENV=production

RUN mkdir -p /app/data /app/log \
    && chown -R node:node /app/data /app/log /app/public

USER node

EXPOSE 5005

CMD ["node", "server.js"]
