import { existsSync, statSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import type * as compiledLayouts from '@crystal-pharm/layouts';

export type SiteRenderer = Pick<typeof compiledLayouts, 'renderTenantSite' | 'layoutRegistry'>;

/**
 * Le rendu passe par le moteur compilé (`layouts/dist/server`), comme pour l'app des sites : on teste exactement
 * ce qui partira en production. Node garde un module importé en cache ; l'URL change donc à chaque compilation.
 */
export function createSiteRendererLoader(compiledServerEntryFile: string): () => Promise<SiteRenderer> {
  let loadedVersion: { modifiedAt: number; siteRenderer: Promise<SiteRenderer> } | undefined;
  return () => {
    if (!existsSync(compiledServerEntryFile)) {
      return Promise.reject(new Error('Le moteur n’est pas encore compilé : l’aperçu se rechargera tout seul dans quelques secondes.'));
    }
    const modifiedAt = statSync(compiledServerEntryFile).mtimeMs;
    if (loadedVersion?.modifiedAt !== modifiedAt) {
      const moduleUrl = `${pathToFileURL(compiledServerEntryFile).href}?version=${modifiedAt}`;
      loadedVersion = { modifiedAt, siteRenderer: import(/* @vite-ignore */ moduleUrl) };
    }
    return loadedVersion.siteRenderer;
  };
}
