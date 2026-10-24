import { solidStart } from '@solidjs/start/config';
import { nitro } from 'nitro/vite';
import { defineConfig, loadEnv } from 'vite';

const repositoryRootDirectory = '../..';
const entryClientFile = './src/entry-client.tsx';
const entryServerFile = './src/entry-server.tsx';
const routeFiles = './src/routes/**/*.tsx';

export default defineConfig(({ mode }) => {
  // Le `.env` est à la racine du dépôt ; en prod, l'environnement vient du serveur.
  Object.assign(process.env, loadEnv(mode, repositoryRootDirectory, ''));

  return {
    // Sans la surcouche de dev : elle s'affichait par-dessus l'aperçu de site-manager.
    plugins: [solidStart({ middleware: './src/middleware.ts', devOverlay: false }), nitro({ preset: 'node' })],
    // Les packages du workspace sont des sources TypeScript : Vite les compile
    // au lieu de les laisser à Node, qui ne résout pas leurs imports sans extension.
    ssr: { noExternal: [/^@crystal-pharm\//] },
    // Vite découvre sinon les dépendances au premier affichage, puis recharge la page en plein
    // chargement : l'aperçu restait bloqué. Tout est repéré et compilé dès le lancement.
    optimizeDeps: { entries: [entryClientFile, routeFiles] },
    // Les sites ne sont servis que derrière la passerelle (Caddy en dev), qui pose le tenant.
    server: {
      // Caddy (dans Docker) joint le site par l'IPv4 de la machine : sans cela, Vite n'écoute qu'en local.
      host: true,
      port: 5177,
      strictPort: true,
      allowedHosts: ['.localhost'],
      warmup: { clientFiles: [entryClientFile, routeFiles], ssrFiles: [entryServerFile, routeFiles] },
    },
  };
});
