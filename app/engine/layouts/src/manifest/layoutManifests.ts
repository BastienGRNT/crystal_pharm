/// <reference types="vite/client" />
import { describeLayoutSettingsFields, type LayoutSettingsField } from './describeLayoutSettingsFields';
import type { LayoutManifest } from './LayoutManifest';

export type DescribedLayoutManifest = LayoutManifest & { layoutId: string; settingsFields: LayoutSettingsField[] };

// Vite remplace cet appel par l'import du manifeste de chaque dossier : un layout créé apparaît sans rien déclarer.
const manifestFiles: Record<string, Record<string, unknown>> = import.meta.glob(['../*/*Manifest.ts', '!../manifest/**'], { eager: true });

/** Un manifeste par layout, dans l'ordre alphabétique de leurs identifiants. */
export const layoutManifests: DescribedLayoutManifest[] = Object.entries(manifestFiles)
  .map(([filePath, fileExports]) => toDescribedLayoutManifest(filePath, fileExports))
  .sort((first, second) => first.layoutId.localeCompare(second.layoutId));

export function findLayoutManifest(layoutId: string): DescribedLayoutManifest | undefined {
  return layoutManifests.find((manifest) => manifest.layoutId === layoutId);
}

/** `../atelier/atelierManifest.ts` doit exporter `atelierManifest`. */
function toDescribedLayoutManifest(filePath: string, fileExports: Record<string, unknown>): DescribedLayoutManifest {
  const layoutId = filePath.split('/')[1] ?? '';
  const manifest = fileExports[`${layoutId}Manifest`];
  if (!isLayoutManifest(manifest)) throw new Error(`${layoutId}/${layoutId}Manifest.ts doit exporter « ${layoutId}Manifest » : { label, description, settingsSchema }.`);
  return { ...manifest, layoutId, settingsFields: describeLayoutSettingsFields(manifest.settingsSchema) };
}

function isLayoutManifest(value: unknown): value is LayoutManifest {
  return typeof value === 'object' && value !== null && 'label' in value && 'description' in value && 'settingsSchema' in value;
}
