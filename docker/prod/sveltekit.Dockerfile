# Une des trois apps SvelteKit (pharmacy/host, group, admin) : le dossier et le nom du package arrivent en arguments.
# Le contexte est la racine du dépôt.
FROM node:24.22.2-bookworm-slim@sha256:c86ecead9e55a5210ac1727de38a4ca840bf03dcaf34dc9749addbf383b1920c AS build
ARG APP_DIRECTORY
ARG APP_PACKAGE
# `development` embarque l'outil de dev (serveur Forge de dev) ; `production` ne l'embarque pas.
ARG BUILD_MODE=production
RUN npm install --global pnpm@11.22.0
WORKDIR /repository/app
COPY app/ ./
RUN pnpm install --frozen-lockfile
RUN NODE_ENV=${BUILD_MODE} pnpm --filter ${APP_PACKAGE} build
RUN pnpm --filter ${APP_PACKAGE} --prod --legacy deploy /runtime \
 && cp -r ${APP_DIRECTORY}/build /runtime/build

FROM node:24.22.2-bookworm-slim@sha256:c86ecead9e55a5210ac1727de38a4ca840bf03dcaf34dc9749addbf383b1920c
ENV NODE_ENV=production PORT=3000 HOST=0.0.0.0
WORKDIR /srv/app
COPY --from=build --chown=node:node /runtime ./
USER node
EXPOSE 3000
CMD ["node", "build/index.js"]
