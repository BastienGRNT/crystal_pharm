import { utimesSync, watch, type FSWatcher } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import solid from 'vite-plugin-solid';
import { siteClientAssetsPath } from './src/shared/siteClientAssetsPath';

const layoutsSourceDirectory = fileURLToPath(new URL('../layouts/src', import.meta.url));
const layoutRegistryFile = fileURLToPath(new URL('../layouts/src/layoutRegistry.ts', import.meta.url));

/**
 * En mode watch, Vite ne voit pas un fichier de page ou de layout qui vient d'être créé ou supprimé.
 * On le lui signale en touchant le fichier qui les découvre, ce qui relance le build.
 */
function rebuildWhenLayoutFilesAreAddedOrRemoved(): Plugin {
  let watcher: FSWatcher | undefined;
  return {
    name: 'rebuild-when-layout-files-are-added-or-removed',
    buildStart() {
      if (!this.meta.watchMode || watcher) return;
      watcher = watch(layoutsSourceDirectory, { recursive: true }, (eventType) => {
        if (eventType === 'rename') utimesSync(layoutRegistryFile, new Date(), new Date());
      });
    },
  };
}

// L'aperçu du banc d'essai : le moteur et les layouts compilés deux fois, comme le fera l'app des sites :
// `vite build` pour le navigateur, `vite build --ssr` pour le serveur.
// Les fichiers construits sont écrasés plutôt que supprimés, pour que le serveur ne les trouve jamais absents.
export default defineConfig(({ isSsrBuild }) => ({
  plugins: [solid({ ssr: true }), rebuildWhenLayoutFilesAreAddedOrRemoved()],
  base: `${siteClientAssetsPath}/`,
  ssr: { noExternal: ['@crystal-pharm/schema', '@crystal-pharm/renderer', '@crystal-pharm/layouts'] },
  build: isSsrBuild
    ? {
        outDir: 'dist/site/server',
        emptyOutDir: false,
        rolldownOptions: { output: { entryFileNames: 'serverEntry.js' } },
      }
    : {
        outDir: 'dist/site/client',
        emptyOutDir: false,
        rolldownOptions: {
          input: { client: 'src/site/browserEntry.tsx' },
          output: { entryFileNames: '[name].js', assetFileNames: '[name][extname]' },
        },
      },
}));
