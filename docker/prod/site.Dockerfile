# app/site (SolidStart, sortie Nitro). Le contexte est la racine du dépôt.
FROM node:24.22.2-bookworm-slim@sha256:c86ecead9e55a5210ac1727de38a4ca840bf03dcaf34dc9749addbf383b1920c AS build
RUN npm install --global pnpm@11.22.0
WORKDIR /repository/app
COPY app/pnpm-lock.yaml app/pnpm-workspace.yaml ./
# Télécharge les dépendances avant de copier le code : cette couche ne change que si le lockfile change.
RUN pnpm fetch
COPY app/ ./
RUN pnpm install --frozen-lockfile --offline
# Toujours en production : en `development`, Nitro embarque la page d'erreur de dev et le build échoue (shiki/onig.wasm).
RUN NODE_ENV=production pnpm --filter @crystal-pharm/site build

FROM node:24.22.2-bookworm-slim@sha256:c86ecead9e55a5210ac1727de38a4ca840bf03dcaf34dc9749addbf383b1920c
ENV NODE_ENV=production PORT=3000 HOST=0.0.0.0
WORKDIR /srv/app
COPY --from=build --chown=node:node /repository/app/site/.output ./.output
USER node
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
