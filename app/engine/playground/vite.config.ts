import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';
import { playgroundServerPlugin } from './src/server/playgroundServerPlugin';
import { playgroundPort } from './src/shared/playgroundHosts';

// Le banc d'essai n'existe qu'en dev : il refuse d'être construit. Seul l'aperçu se compile, par `vite.site.config.ts`.
export default defineConfig(({ command }) => {
  if (command === 'build' || process.env.NODE_ENV === 'production') {
    throw new Error('Le banc d’essai du moteur ne sert qu’en développement : il ne se construit pas et ne se déploie pas.');
  }
  return {
    root: fileURLToPath(new URL('./src/panel', import.meta.url)),
    plugins: [
      solid(),
      playgroundServerPlugin({
        layoutsSourceDirectory: fileURLToPath(new URL('../layouts/src', import.meta.url)),
        compiledSiteDirectory: fileURLToPath(new URL('./dist/site', import.meta.url)),
        playgroundServerDirectory: fileURLToPath(new URL('./src/server', import.meta.url)),
      }),
    ],
    server: { host: 'localhost', port: playgroundPort, strictPort: true, open: true, allowedHosts: ['.localhost'] },
  };
});
