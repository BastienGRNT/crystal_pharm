import { solidStart } from '@solidjs/start/config';
import { nitro } from 'nitro/vite';
import { defineConfig, loadEnv } from 'vite';

const repositoryRootDirectory = '../..';

export default defineConfig(({ mode }) => {
  // Le `.env` est à la racine du dépôt ; en prod, l'environnement vient du serveur.
  Object.assign(process.env, loadEnv(mode, repositoryRootDirectory, ''));

  return {
    plugins: [solidStart({ middleware: './src/middleware.ts' }), nitro({ preset: 'node' })],
    // Les packages du workspace sont des sources TypeScript : Vite les compile
    // au lieu de les laisser à Node, qui ne résout pas leurs imports sans extension.
    ssr: { noExternal: [/^@crystal-pharm\//] },
    // Les sites ne sont servis que derrière la passerelle (Caddy en dev), qui pose le tenant.
    server: { port: 5177, strictPort: true, allowedHosts: ['.localhost'] },
  };
});
