import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { PlaygroundCatalog } from '../../shared/PlaygroundCatalog';

/** Les mêmes dossiers que ceux que découvre le moteur : un layout créé apparaît au prochain chargement du panneau. */
export function discoverLayouts(layoutsSourceDirectory: string): PlaygroundCatalog['layouts'] {
  return readdirSync(layoutsSourceDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(layoutsSourceDirectory, entry.name, 'pages')))
    .map((entry) => ({ layoutId: entry.name, pagePaths: listPagePaths(join(layoutsSourceDirectory, entry.name, 'pages')) }))
    .sort((first, second) => first.layoutId.localeCompare(second.layoutId));
}

/** Même règle que le moteur : `index.tsx` → `/`, `ordonnance.tsx` → `/ordonnance`, `equipe/index.tsx` → `/equipe`. */
function listPagePaths(pagesDirectory: string): string[] {
  const pageFiles = readdirSync(pagesDirectory, { recursive: true, encoding: 'utf8' }).filter((file) => file.endsWith('.tsx'));
  return pageFiles
    .map((pageFile) => {
      const withoutExtension = pageFile.replaceAll('\\', '/').slice(0, -'.tsx'.length);
      const withoutIndex = withoutExtension === 'index' ? '' : withoutExtension.replace(/\/index$/, '');
      return `/${withoutIndex}`;
    })
    .sort((first, second) => (first === '/' ? -1 : second === '/' ? 1 : first.localeCompare(second)));
}
