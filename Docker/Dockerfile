FROM node:25.1-alpine AS builder

WORKDIR /src
COPY app/package*.json ./
RUN npm ci

COPY app/. ./
RUN npm run prisma:generate
RUN npm run build

FROM node:25.1-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /src ./
COPY Docker/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["/app/entrypoint.sh"]
