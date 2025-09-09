FROM node:22-alpine AS builder

WORKDIR /app

# --- Server Deps ---
COPY package*.json ./
RUN npm install --production

# --- Install+Build Deps ---
WORKDIR /app/client
COPY ./client/package*.json ./
RUN npm install
COPY ./client/ ./
RUN npm run build

# --- Final Files ---
WORKDIR /app
COPY . .
RUN mkdir -p ./public && mv ./client/dist/* ./public
# Clean up the client source code
RUN rm -rf ./client

# ---- Final Stage ----
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
