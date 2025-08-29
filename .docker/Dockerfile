FROM node:16 AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY . .

RUN mkdir -p ./public ./data \
    && cd ./client \
    && npm install --production \
    && npm run build \
    && cd .. \
    && mv ./client/build/* ./public \
    && rm -rf ./client

FROM node:16-alpine

WORKDIR /app
COPY --from=builder /app /app

RUN apk add --no-cache curl jq sqlite

# Set environment
ENV NODE_ENV=production
ENV PASSWORD=flame_password

# Ensure correct permissions for runtime directory
RUN mkdir -p /app/data /app/log /app/public \
    && chown -R node:node /app/data /app/log /app/public

USER node

EXPOSE 5005

CMD ["node", "server.js"]
