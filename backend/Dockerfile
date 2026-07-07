# -----------------------
# Build Stage
# -----------------------
FROM node:20-bookworm AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

# -----------------------
# Production Stage
# -----------------------
FROM node:20-bookworm

WORKDIR /app

RUN apt-get update && \
    apt-get install -y openssl libssl-dev ca-certificates && \
    rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 5000

CMD ["sh","-c","npx prisma migrate deploy && node dist/server.js"]