import * as v from 'valibot';
import type { LayoutManifest } from '../manifest/LayoutManifest';

/** Le layout essentiel n'a aucun réglage : il ne contient que l'obligatoire. */
export const essentialSettingsSchema = v.object({});

export type EssentialSettings = v.InferOutput<typeof essentialSettingsSchema>;

export const essentialManifest: LayoutManifest = {
  label: 'Essentiel',
  description: 'Une seule page sobre, avec l’obligatoire et rien d’autre.',
  settingsSchema: essentialSettingsSchema,
};
