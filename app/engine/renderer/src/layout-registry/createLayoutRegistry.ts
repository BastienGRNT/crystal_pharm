import { ModuleNameSchema, type PharmacyInfo } from '@crystal-pharm/schema';
import * as v from 'valibot';
import type { LayoutPage } from '../contract/definePage';
import type { Part } from '../contract/Part';
import type { LayoutModuleComponents, PharmacySiteLayout } from '../contract/PharmacySiteLayout';
import type { EnabledModulesProps } from '../module-props/toEnabledModulesProps';
import type { PageKit } from '../page-kit/createPageKit';

/** Un layout tel que le moteur le manipule, quel que soit le type de ses réglages. */
export type RegisteredLayout = {
  id: string;
  moduleComponents: LayoutModuleComponents;
  findPage: (requestedPath: string) =>
    | {
        title: string;
        render: (input: { pharmacy: PharmacyInfo; layoutSettings: unknown; modules: EnabledModulesProps; pageKit: PageKit }) => Part<'page'>;
      }
    | undefined;
};

export type LayoutRegistry = {
  layoutIds: string[];
  findLayoutById: (layoutId: string) => RegisteredLayout;
};

/**
 * Construit les layouts à partir de leurs dossiers, sans aucune liste à tenir à jour.
 * On lui passe le résultat de deux `import.meta.glob`, chemins relatifs au dossier des layouts :
 * - `layoutFolderFiles` : les fichiers à la racine de chaque dossier (`./atelier/atelier.ts`…) ; l'un d'eux exporte le layout ;
 * - `pageFiles` : les fichiers de pages (`./atelier/pages/ordonnance.tsx` → la page `/ordonnance` du layout `atelier`).
 */
export function createLayoutRegistry(files: {
  layoutFolderFiles: Record<string, Record<string, unknown>>;
  pageFiles: Record<string, unknown>;
}): LayoutRegistry {
  const layoutsById = new Map<string, PharmacySiteLayout<unknown>>();
  for (const [filePath, fileExports] of Object.entries(files.layoutFolderFiles)) {
    const layoutId = folderOf(filePath);
    for (const exportedValue of Object.values(fileExports)) {
      if (!isPharmacySiteLayout(exportedValue)) continue;
      if (layoutsById.has(layoutId)) throw new Error(`Le dossier « ${layoutId} » exporte deux PharmacySiteLayout : un seul par dossier.`);
      layoutsById.set(layoutId, exportedValue);
    }
  }
  for (const pageFilePath of Object.keys(files.pageFiles)) {
    const layoutId = folderOf(pageFilePath);
    if (!layoutsById.has(layoutId)) throw new Error(`Le dossier « ${layoutId} » a des pages, mais aucun de ses fichiers n'exporte de PharmacySiteLayout.`);
  }

  const registeredLayouts = [...layoutsById].map(([layoutId, layout]) => toRegisteredLayout(layoutId, layout, findLayoutPages(layoutId, files.pageFiles)));

  return {
    layoutIds: registeredLayouts.map((registeredLayout) => registeredLayout.id),
    findLayoutById: (layoutId) => {
      const registeredLayout = registeredLayouts.find((candidate) => candidate.id === layoutId);
      if (!registeredLayout) {
        const knownLayoutIds = registeredLayouts.map((candidate) => candidate.id).join(', ');
        throw new Error(`Layout inconnu : « ${layoutId} ». Layouts disponibles : ${knownLayoutIds}.`);
      }
      return registeredLayout;
    },
  };
}

function toRegisteredLayout(layoutId: string, layout: PharmacySiteLayout<unknown>, pagesByPath: Map<string, LayoutPage<unknown>>): RegisteredLayout {
  return {
    id: layoutId,
    moduleComponents: layout,
    findPage: (requestedPath) => {
      const page = pagesByPath.get(requestedPath);
      if (!page) return undefined;
      return {
        title: page.title,
        render: (input) => {
          // Les réglages du tenant sont validés ici, et complétés par les valeurs par défaut du schéma.
          const settingsResult = v.safeParse(layout.settingsSchema, input.layoutSettings);
          if (!settingsResult.success) {
            throw new Error(`Réglages invalides pour le layout « ${layoutId} » :\n${v.summarize(settingsResult.issues)}`);
          }
          return page.component({ pharmacy: input.pharmacy, settings: settingsResult.output, modules: input.modules, pageKit: input.pageKit });
        },
      };
    },
  };
}

/** `./atelier/pages/index.tsx` → `/`, `./atelier/pages/ordonnance.tsx` → `/ordonnance`, `./atelier/pages/equipe/index.tsx` → `/equipe`. */
function findLayoutPages(layoutId: string, pageFiles: Record<string, unknown>): Map<string, LayoutPage<unknown>> {
  const pagesFolder = `./${layoutId}/pages/`;
  const pagesByPath = new Map<string, LayoutPage<unknown>>();
  for (const [pageFilePath, page] of Object.entries(pageFiles)) {
    if (!pageFilePath.startsWith(pagesFolder)) continue;
    if (!isLayoutPage(page)) throw new Error(`${pageFilePath.slice(2)} doit exporter par défaut definePage({ title, component }).`);
    const urlPath = `/${pageFilePath.slice(pagesFolder.length, -'.tsx'.length)}`.replace(/\/?index$/, '');
    pagesByPath.set(urlPath === '' ? '/' : urlPath, page);
  }
  if (pagesByPath.size === 0) throw new Error(`Le layout « ${layoutId} » n'a aucune page dans ${layoutId}/pages/.`);
  return pagesByPath;
}

function folderOf(filePath: string): string {
  return filePath.split('/')[1] ?? '';
}

function isPharmacySiteLayout(value: unknown): value is PharmacySiteLayout<unknown> {
  if (typeof value !== 'object' || value === null || !('settingsSchema' in value)) return false;
  return ModuleNameSchema.options.every((moduleName) => moduleName in value);
}

function isLayoutPage(value: unknown): value is LayoutPage<unknown> {
  return typeof value === 'object' && value !== null && 'title' in value && 'component' in value && typeof value.component === 'function';
}
