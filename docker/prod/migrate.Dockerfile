# Les migrations Drizzle de tous les schémas, une fois par déploiement (comme `make migrate`).
FROM node:24.22.2-bookworm-slim@sha256:c86ecead9e55a5210ac1727de38a4ca840bf03dcaf34dc9749addbf383b1920c
ENV NODE_ENV=development
RUN npm install --global pnpm@11.22.0
WORKDIR /repository/app
COPY app/ ./
RUN pnpm install --frozen-lockfile && chown -R node:node /repository
USER node
CMD ["sh", "-c", "pnpm --recursive migrate && pnpm --filter @crystal-pharm/billing-db rebuild-tool-access"]
